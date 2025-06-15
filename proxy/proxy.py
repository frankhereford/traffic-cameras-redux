import json
import urllib.request
import base64
import os
import ssl
import redis
import jwt
import hashlib
import io
import boto3
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Lazily-initialised module-level Redis client.  This allows the same
# connection to be reused across multiple Lambda invocations that share the
# execution environment, dramatically reducing cold-start time.
_redis_client = None


def _get_redis_client():
    """Return an initialised Redis client or None if the connection fails."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    try:
        redis_host = os.environ.get("REDIS_HOST", "localhost")
        redis_port = int(os.environ.get("REDIS_PORT", 6379))
        redis_password = os.environ.get("REDIS_PASSWORD")
        # The docker-compose file starts Redis with TLS only, so default to TLS
        use_tls = os.environ.get("REDIS_USE_TLS", "true").lower() in ("1", "true", "yes")

        connection_kwargs = {
            "host": redis_host,
            "port": redis_port,
            "password": redis_password,
            # We want raw bytes; the Lambda will do its own base64 encoding
            "decode_responses": False,
        }

        if use_tls:
            # In local development a self-signed certificate is used. We disable
            # certificate verification here (CERT_NONE). For production you
            # *should* provide a proper CA and set CERT_REQUIRED.
            connection_kwargs.update({
                "ssl": True,
                "ssl_cert_reqs": ssl.CERT_NONE,
            })

        _redis_client = redis.Redis(**connection_kwargs)
        # Validate the connection – raises if authentication fails
        _redis_client.ping()
        print("Connected to Redis at", redis_host)
    except Exception as err:
        # Log the problem and fall back to no-cache mode
        print(f"Redis connection failed: {err}")
        _redis_client = None

    return _redis_client


def _serve_fallback_image(reason):
    """Log the reason and return a response to serve the fallback image."""
    print(f"{reason}. Serving fallback image.")
    try:
        # Look for nonono.jpg in the same directory as this script
        script_dir = os.path.dirname(__file__)
        fallback_path = os.path.join(script_dir, "nonono.jpg")
        with open(fallback_path, "rb") as f:
            image_bytes = f.read()

        encoded_image = base64.b64encode(image_bytes).decode("utf-8")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "image/jpeg"},
            "isBase64Encoded": True,
            "body": encoded_image,
        }
    except FileNotFoundError:
        print("Fallback image 'nonono.jpg' not found.")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Fallback image not found"}),
        }


def handler(event, context):
    """
    Main Lambda handler function
    Parameters:
        event: Dict containing the Lambda function event data
        context: Lambda runtime context
    Returns:
        Dict compatible with Lambda Function URL / API Gateway
    """
    try:
        # Return 404 for favicon requests early to avoid further processing.
        if event.get("rawPath") == "/favicon.ico":
            print("Favicon request suppressed.")
            return {
                "statusCode": 404,
                "body": json.dumps({"error": "Not Found"}),
            }

        #print("Received event: " + json.dumps(event, indent=2))

        # Check for JWT in header or query string
        jwt_token = None
        headers = {k.lower(): v for k, v in event.get("headers", {}).items()}
        if "x-camera" in headers:
            jwt_token = headers["x-camera"]
        
        query_params = event.get("queryStringParameters")
        if query_params and "x-camera" in query_params:
            jwt_token = query_params["x-camera"]

        if not jwt_token:
            return _serve_fallback_image("No JWT provided")

        try:
            # Decode the JWT, verifying the signature
            jwt_secret = os.environ.get("JWT_SHARED_SECRET")
            if jwt_secret:
                decoded_token = jwt.decode(
                    jwt_token,
                    jwt_secret,
                    algorithms=["HS256"]
                )
                print("Decoded and verified JWT: " + json.dumps(decoded_token, indent=2))
            else:
                # JWT_SECRET not configured. Log the attempted token payload and reject.
                print("Warning: JWT_SHARED_SECRET is not configured. Rejecting request.")
                try:
                    unverified_payload = jwt.decode(
                        jwt_token, options={"verify_signature": False}
                    )
                    print(
                        "Attempted JWT payload (unverified): "
                        + json.dumps(unverified_payload, indent=2)
                    )
                except jwt.InvalidTokenError as e:
                    print(f"Malformed JWT provided, could not decode for logging: {e}")

                return _serve_fallback_image(
                    "JWT signature cannot be verified by server"
                )

            # If we're here, token was decoded. Try to get camera ID.
            camera_id = str(decoded_token["coaCamera"])
            print(f"Using camera ID from JWT: {camera_id}")

            # Check for no-cache directive in JWT
            skip_cache = decoded_token.get("no-cache", False)

        except (jwt.InvalidTokenError, KeyError, TypeError) as e:
            if isinstance(e, jwt.InvalidTokenError):
                reason = f"Invalid JWT: {e}"
            else:
                reason = "JWT decoded, but missing 'coaCamera' claim or not a dictionary"
            return _serve_fallback_image(reason)

        cache_key = f"camera:{camera_id}"
        image_bytes = None

        # Attempt to fetch the image from Redis first
        redis_client = _get_redis_client()
        if redis_client:
            if skip_cache:
                print("'no-cache' in JWT, skipping Redis lookup.")
            else:
                try:
                    cached = redis_client.get(cache_key)
                    if cached:
                        print("Cache hit – serving image from Redis")
                        image_bytes = cached
                except Exception as r_err:
                    print(f"Failed to fetch from Redis cache: {r_err}")

        # If not cached, download from the Austin Mobility CCTV feed
        if image_bytes is None:
            print("Cache miss – downloading image from source")
            image_url = f"https://cctv.austinmobility.io/image/{camera_id}.jpg"
            with urllib.request.urlopen(image_url) as img_response:
                original_image_bytes = img_response.read()

            try:
                # Calculate SHA256 hash of the original image
                sha256_hash = hashlib.sha256(original_image_bytes).hexdigest()
                hash_prefix = sha256_hash[:8]
                print(f"Image SHA256: {sha256_hash}, using prefix: {hash_prefix}")

                try:
                    s3_bucket = os.environ.get("S3_BUCKET_NAME", "atx-traffic-cameras")
                    s3_key = f"cameras/{camera_id}/{sha256_hash}.jpg"

                    s3 = boto3.client(
                        "s3",
                        region_name=os.environ.get("AWS_REGION", "us-east-1"),
                    )

                    try:
                        s3.head_object(Bucket=s3_bucket, Key=s3_key)
                        print(f"File already exists in S3: s3://{s3_bucket}/{s3_key}, skipping upload.")
                    except s3.exceptions.ClientError as e:
                        if e.response["Error"]["Code"] == "404":
                            print(f"Uploading image to S3: s3://{s3_bucket}/{s3_key}")
                            s3.upload_fileobj(
                                io.BytesIO(original_image_bytes),
                                s3_bucket,
                                s3_key,
                                ExtraArgs={"ContentType": "image/jpeg"},
                            )
                            print("Successfully uploaded to S3.")
                        else:
                            # Log other client errors
                            print(f"Error checking S3 for {s3_key}: {e}")
                except Exception as s3_err:
                    print(f"An error occurred during S3 operation: {s3_err}")

                img = Image.open(io.BytesIO(original_image_bytes)).convert("RGBA")

                # Define a baseline for scaling UI elements. 1080p is a common standard.
                base_height = 1080.0
                scale_factor = img.height / base_height

                # Scale font size and margin based on the image's vertical resolution.
                # Ensure a minimum size of 1 to avoid errors with tiny images.
                font_size = max(1, int(32 * scale_factor))
                margin = max(1, int(10 * scale_factor))

                # Try to load a suitable fixed-width font
                font = None
                # Common paths for fonts in Lambda/Linux environments
                font_paths = [
                    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
                ]
                for path in font_paths:
                    try:
                        font = ImageFont.truetype(path, font_size)
                        break
                    except IOError:
                        continue
                
                if not font:
                    print("Could not load a truetype font, falling back to default.")
                    try:
                        # Pillow >= 9.5.0 supports the size argument
                        font = ImageFont.load_default(size=font_size)
                    except AttributeError:
                        print("Warning: Pillow version may not support 'size' for load_default(). Using default size.")
                        font = ImageFont.load_default()

                draw = ImageDraw.Draw(img)

                # Position text in the upper right corner
                text_bbox = draw.textbbox((0, 0), hash_prefix, font=font)
                text_width = text_bbox[2] - text_bbox[0]


                x = img.width - text_width - margin
                y = margin

                # Create a blurred black shadow
                shadow_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
                shadow_draw = ImageDraw.Draw(shadow_layer)
                shadow_draw.text((x, y), hash_prefix, font=font, fill="black")
                shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=5))

                # Composite the shadow onto the image
                img = Image.alpha_composite(img, shadow_layer)

                # Draw the white text on top
                final_draw = ImageDraw.Draw(img)
                final_draw.text((x, y), hash_prefix, font=font, fill="white")

                # Save the modified image to a buffer
                buffer = io.BytesIO()
                img.convert("RGB").save(buffer, format="JPEG")
                image_bytes = buffer.getvalue()

            except Exception as img_err:
                print(f"Failed to process image and add SHA overlay: {img_err}")
                # Fall back to using the original, unmodified image
                image_bytes = original_image_bytes

            # Store the fresh result in Redis (TTL 60 seconds)
            if redis_client and not skip_cache:
                try:
                    redis_client.setex(cache_key, 60 * 5, image_bytes)
                    print("Stored image in Redis with TTL=60s")
                except Exception as r_err:
                    print(f"Failed to store image in Redis: {r_err}")

        # Encode binary payload as base64 for Lambda response
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")

        response = {
            "statusCode": 200,
            "headers": {"Content-Type": "image/jpeg"},
            "isBase64Encoded": True,
            "body": encoded_image,
        }
        return response

    except Exception as e:
        print(f"Error processing event: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }

