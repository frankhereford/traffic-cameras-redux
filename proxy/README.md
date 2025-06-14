# Proxy Service

This directory contains a Python-based AWS Lambda function that acts as a proxy for traffic camera images from the City of Austin's public feed. It enhances the images by adding a content hash overlay and provides caching and archiving capabilities.

## What it does

The core functionality of this service is to:

1.  **Receive Requests**: Accept requests containing a JSON Web Token (JWT) that specifies a camera ID.
2.  **Validate JWT**: Securely validate the incoming JWT using a shared secret. The token must contain a `coaCamera` claim for the camera's ID.
3.  **Fetch Image**: Download the corresponding traffic camera image from `https://cctv.austinmobility.io/image/{camera_id}.jpg`.
4.  **Cache**: Use a Redis instance to cache the fetched images for 60 seconds to reduce latency and load on the source server. Caching can be bypassed with a `no-cache: true` claim in the JWT.
5.  **Process and Watermark**:
    *   Calculate the SHA-256 hash of the image.
    *   Add the first 8 characters of this hash as a semi-transparent watermark in the top-right corner of the image. This allows for quick visual verification of image content.
6.  **Archive (Optional)**: If configured, it archives the original, unmodified image to an Amazon S3 bucket, preventing duplicate storage.
7.  **Serve Image**: Return the processed image to the client. If any step fails, it serves a fallback image (`nonono.jpg`).

## How it works

The service is designed to be run as an AWS Lambda function, containerized using Docker. The local development setup uses `docker-compose` to simulate the Lambda environment.

-   **Lambda Emulation**: The `aws-lambda-rie` (Runtime Interface Emulator) is used to run the Lambda function locally. The `proxy-url` service in the `docker-compose.yaml` then emulates the Lambda Function URL, making the function accessible over HTTP.
-   **Dependencies**:
    -   `redis`: For caching.
    -   `PyJWT`: for JWT decoding and validation.
    -   `Pillow`: For image processing (adding the watermark).
    -   `boto3`: For interacting with AWS S3 (included in the Lambda environment).

## How to run it

### Local Development

The service is orchestrated using the main `docker-compose.yaml` file in the root of the project.

1.  **Environment Variables**: Create a `.env` file in the project root. The proxy service requires the following variables:

    ```bash
    # Redis connection (required)
    REDIS_HOST=redis
    REDIS_PORT=6379
    REDIS_PASSWORD=your-super-secret-password # Should match the one for the redis service
    REDIS_USE_TLS=true

    # JWT Validation (required)
    JWT_SHARED_SECRET=your-jwt-secret

    # S3 Archiving (optional)
    AWS_ACCESS_KEY_ID=your-aws-access-key-id
    AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
    AWS_REGION=us-east-1
    S3_BUCKET_NAME=your-s3-bucket-name
    ```

2.  **Start the services**:
    From the project root, run:
    ```bash
    docker-compose up
    ```

3.  **Accessing the service**:
    The service will be available at `http://localhost:8080`. To get a camera image, you need to provide a valid JWT.

    You can generate a JWT (e.g., on [jwt.io](https://jwt.io/)) with the following payload:

    ```json
    {
      "coaCamera": "1521"
    }
    ```

    Sign it using the `HS256` algorithm and the `JWT_SHARED_SECRET` you defined in your `.env` file.

    Then, make a request with the token in the `x-camera` header or as a query parameter:

    **Header:**
    ```bash
    curl -H "x-camera: <your-jwt>" http://localhost:8080
    ```

    **Query Parameter:**
    ```bash
    curl http://localhost:8080?x-camera=<your-jwt>
    ```

    To bypass the cache, add `"no-cache": true` to your JWT payload.

## Fallback Mechanism

If the JWT is missing or invalid, or if any other error occurs during processing, the service will return a static fallback image, `nonono.jpg`. 