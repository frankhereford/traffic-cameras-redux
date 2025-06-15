import json
import subprocess

def handler(event, context):
    """
    Main Lambda handler function
    Parameters:
        event: Dict containing the Lambda function event data
        context: Lambda runtime context
    Returns:
        Dict compatible with Lambda Function URL / API Gateway
    """
    print("Received event: " + json.dumps(event, indent=2))
    try:
        print(subprocess.check_output(["nvidia-smi"]).decode())
        message = "This code is running on a remote GPU!"
    except (subprocess.CalledProcessError, FileNotFoundError):
        message = "GPU not available"
    print("Message: " + message)
    return {
        "statusCode": 200,
        "body": json.dumps({"message": message}),
    } 