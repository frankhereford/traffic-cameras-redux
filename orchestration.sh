#!/bin/bash
set -e
set -o pipefail

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Check if AWS_ACCOUNT_NUMBER is set
if [ -z "$AWS_ACCOUNT_NUMBER" ]; then
  echo "Error: AWS_ACCOUNT_NUMBER is not set. Please create a .env file in the root of the repository with:"
  echo "AWS_ACCOUNT_NUMBER=969346816767"
  exit 1
fi

ECR_REGISTRY="${AWS_ACCOUNT_NUMBER}.dkr.ecr.us-east-1.amazonaws.com"

# Function to check login status
check_login() {
  if [ -f ~/.docker/config.json ] && grep -q "$ECR_REGISTRY" ~/.docker/config.json; then
      echo "Already logged in to ECR registry: $ECR_REGISTRY"
      return 0
  fi
  echo "Not logged in to ECR registry: $ECR_REGISTRY"
  return 1
}

# Function to perform login
login() {
  echo "Logging in to AWS ECR..."
  aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$ECR_REGISTRY"
}

# Function to build and push proxy
build_and_push_proxy() {
  echo "Building and pushing camera-image-proxy..."
  LAMBDA_NAME="camera-image-proxy"
  docker buildx build --platform linux/amd64 --provenance=false -t "${LAMBDA_NAME}:latest" proxy
  docker tag "${LAMBDA_NAME}:latest" "${ECR_REGISTRY}/${LAMBDA_NAME}:latest"
  docker push "${ECR_REGISTRY}/${LAMBDA_NAME}:latest"
  NEW_VERSION=$(aws lambda update-function-code --function-name "${LAMBDA_NAME}" --image-uri "${ECR_REGISTRY}/${LAMBDA_NAME}:latest" --publish --query 'Version' --output text)
  cleanup_old_versions "${LAMBDA_NAME}" "${NEW_VERSION}"
}

# Function to build and push detector
build_and_push_detector() {
  echo "Building and pushing detector..."
  LAMBDA_NAME="camera-image-detector"
  docker buildx build --platform linux/amd64 --provenance=false --build-arg BEAM_TOKEN -t "${LAMBDA_NAME}:latest" detector
  docker tag "${LAMBDA_NAME}:latest" "${ECR_REGISTRY}/${LAMBDA_NAME}:latest"
  docker push "${ECR_REGISTRY}/${LAMBDA_NAME}:latest"
  NEW_VERSION=$(aws lambda update-function-code --function-name "${LAMBDA_NAME}" --image-uri "${ECR_REGISTRY}/${LAMBDA_NAME}:latest" --publish --query 'Version' --output text)
  cleanup_old_versions "${LAMBDA_NAME}" "${NEW_VERSION}"
}

# Function to clean up old lambda versions
cleanup_old_versions() {
  LAMBDA_NAME=$1
  VERSION_TO_KEEP=$2
  echo "Cleaning up old versions for $LAMBDA_NAME, keeping version $VERSION_TO_KEEP"
  
  OLD_VERSIONS=$(aws lambda list-versions-by-function --function-name "$LAMBDA_NAME" --query "Versions[?!contains(['\$LATEST', '$VERSION_TO_KEEP'], Version)].Version" --output text)

  if [ -n "$OLD_VERSIONS" ]; then
    for version in $OLD_VERSIONS; do
      echo "Deleting old version $version of $LAMBDA_NAME..."
      aws lambda delete-function --function-name "$LAMBDA_NAME" --qualifier "$version"
    done
    echo "Cleanup of old versions for $LAMBDA_NAME complete."
  else
    echo "No old versions to delete for $LAMBDA_NAME."
  fi
}

usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -l, --login    Log in to AWS ECR"
  echo "  -p, --proxy    Build and push the camera-image-proxy"
  echo "  -d, --detector Build and push the detector"
  echo "  -h, --help     Display this help and exit"
}

# Parse arguments using getopt
# The -o option string specifies short options. A colon after an option indicates it requires an argument.
# The -l option string specifies long options.
# The -- separates the options from the arguments.
TEMP=$(getopt -o lpdh --long login,proxy,detector,help -n 'orchestration.sh' -- "$@")
if [ $? != 0 ]; then
    usage
    exit 1
fi

# `eval set --` is used to handle options with spaces correctly.
eval set -- "$TEMP"

DO_LOGIN=false
DO_PROXY=false
DO_DETECTOR=false

while true; do
  case "$1" in
    -l | --login)
      DO_LOGIN=true
      shift
      ;;
    -p | --proxy)
      DO_PROXY=true
      shift
      ;;
    -d | --detector)
      DO_DETECTOR=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    *)
      echo "Internal error!"
      exit 1
      ;;
  esac
done

if [ "$DO_LOGIN" = false ] && [ "$DO_PROXY" = false ] && [ "$DO_DETECTOR" = false ]; then
    usage
    exit 1
fi

if [ "$DO_PROXY" = true ] || [ "$DO_DETECTOR" = true ]; then
  if ! check_login; then
    login
  fi
fi

if [ "$DO_PROXY" = true ]; then
  build_and_push_proxy
fi

if [ "$DO_DETECTOR" = true ]; then
  build_and_push_detector
fi

if [ "$DO_LOGIN" = true ] && [ "$DO_PROXY" = false ] && [ "$DO_DETECTOR" = false ]; then
    if ! check_login; then
        login
    fi
fi 