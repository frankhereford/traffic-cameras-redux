import json
import urllib.request
import base64
import os
import ssl
import redis
import jwt
import hashlib
import io
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

        print("Received event: " + json.dumps(event, indent=2))

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
                # For now, if no secret is configured, just log and decode without verification.
                # In a production environment, you would likely want to fail hard here.
                print("Warning: JWT_SECRET not configured. Decoding without verification.")
                decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})
                print("Decoded JWT (unverified): " + json.dumps(decoded_token, indent=2))
            
            # If we're here, token was decoded. Try to get camera ID.
            camera_id = str(decoded_token["coaCamera"])
            print(f"Using camera ID from JWT: {camera_id}")

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

                img = Image.open(io.BytesIO(original_image_bytes)).convert("RGBA")

                # Try to load a suitable fixed-width font
                font = None
                font_size = 200 # Made ~10x bigger
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
                    font = ImageFont.load_default()

                draw = ImageDraw.Draw(img)

                # Position text in the upper right corner
                margin = 10
                try:
                    # Pillow >= 10.0.0
                    text_bbox = draw.textbbox((0, 0), hash_prefix, font=font)
                    text_width = text_bbox[2] - text_bbox[0]
                except AttributeError:
                    # Pillow < 10.0.0
                    text_width, _ = draw.textsize(hash_prefix, font=font)

                x = img.width - text_width - margin
                y = margin

                # Create a blurred black shadow
                shadow_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
                shadow_draw = ImageDraw.Draw(shadow_layer)
                shadow_draw.text((x, y), hash_prefix, font=font, fill="black")
                shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=15))

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
            if redis_client:
                try:
                    redis_client.setex(cache_key, 60, image_bytes)
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

