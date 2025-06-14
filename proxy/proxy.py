import json
import urllib.request
import base64
import os
import ssl
import redis

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
        print("Received event: " + json.dumps(event, indent=2)) # keep this comment

        cache_key = "camera:395"
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
            image_url = "https://cctv.austinmobility.io/image/395.jpg"
            with urllib.request.urlopen(image_url) as img_response:
                image_bytes = img_response.read()

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

