import json
import os
import re
import jwt
import requests
from prisma import Prisma
import boto3
import hashlib
from PIL import Image as PILImage
import io


db = Prisma()
db.connect()


def handler(event, context):
    """
    Main Lambda handler function
    Parameters:
        event: Dict containing the Lambda function event data
        context: Lambda runtime context
    Returns:
        Dict compatible with Lambda Function URL / API Gateway
    """
    # print("Received event: " + json.dumps(event, indent=2)) # keep this comment

    key = event["Records"][0]["s3"]["object"]["key"]
    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    print(f"Received key: {key} from bucket: {bucket}")

    match = re.search(r"([^/]+)\.jpg$", key)
    if not match:
        print(f"Could not extract image hash from key: {key}")
        return {
            "statusCode": 400,
            "body": json.dumps(
                {"message": f"Could not extract image hash from key: {key}"}
            ),
        }
    image_hash = match.group(1)
    print(f"Extracted image_hash: {image_hash}")

    image = db.image.find_unique(where={"hash": image_hash}, include={"camera": True})
    if not image:
        print(f"Image with hash {image_hash} not found in database.")
        return {
            "statusCode": 404,
            "body": json.dumps({"message": f"Image with hash {image_hash} not found."}),
        }

    jwt_shared_secret = os.environ["JWT_SHARED_SECRET"]
    payload = {"key": key}
    encoded_jwt = jwt.encode(payload, jwt_shared_secret, algorithm="HS256")

    url = os.environ["DETECTOR_BEAM_LAMBDA"]
    beam_token = os.environ.get("BEAM_TOKEN")

    headers = {
        "Content-Type": "application/json",
    }

    if beam_token:
        headers["Authorization"] = f"Bearer {beam_token}"

    data = {"jwt": encoded_jwt}

    print(f"Calling endpoint with JWT: {encoded_jwt}")

    response = requests.post(url, headers=headers, json=data)

    # print("Received response: " + response.text)

    response_json = json.loads(response.text)
    detections = response_json["detections"]
    print(f"Found {len(detections)} detections.")

    image_width = response_json.get("width")
    image_height = response_json.get("height")

    # 1. Create all detections in DB
    if detections:
        new_detections_data = []
        for detection in detections:
            box = detection["box"]
            new_detections_data.append(
                {
                    "label": detection["label"],
                    "confidence": detection["confidence"],
                    "xMin": int(box["xMin"]),
                    "yMin": int(box["yMin"]),
                    "xMax": int(box["xMax"]),
                    "yMax": int(box["yMax"]),
                    "imageId": image.id,
                }
            )

        if new_detections_data:
            db.detection.create_many(data=new_detections_data, skip_duplicates=True)
            print(f"Created {len(new_detections_data)} detections in database.")

    # 2. Query them back
    created_detections = db.detection.find_many(where={"imageId": image.id})
    print(f"Queried back {len(created_detections)} detections.")

    # 3. Process detections: crop, hash, print
    if created_detections:
        s3_client = boto3.client("s3")
        try:
            s3_response = s3_client.get_object(Bucket=bucket, Key=key)
            image_bytes = s3_response["Body"].read()
            source_image = PILImage.open(io.BytesIO(image_bytes))

            img_width, img_height = source_image.size
            print(f"Source image size: {img_width}x{img_height}")

            image_width = img_width
            image_height = img_height

            border = int(os.environ.get("DETECTION_IMAGE_BORDER", 10))

            for detection in created_detections:
                left = max(0, detection.xMin - border)
                top = max(0, detection.yMin - border)
                right = min(img_width, detection.xMax + border)
                bottom = min(img_height, detection.yMax + border)

                cropped_image = source_image.crop((left, top, right, bottom))

                img_byte_arr = io.BytesIO()
                cropped_image.save(img_byte_arr, format="PNG")
                img_byte_arr_value = img_byte_arr.getvalue()

                # sha256_hash = hashlib.sha256(img_byte_arr_value).hexdigest()

                # print(f"Detection {detection.id}: new image SHA256 is {sha256_hash}")

                date_str = image.createdAt.strftime("%Y%m%d-%H%M%S")
                s3_key = f"detections/{image.camera.coaId}/{date_str}-{image.id}/{detection.label}-{detection.id}.png"
                s3_client.put_object(
                    Bucket=bucket,
                    Key=s3_key,
                    Body=img_byte_arr_value,
                    ContentType="image/png",
                )
                print(
                    f"Detection {detection.id}  -> Uploaded to s3://{bucket}/{s3_key}"
                )

        except Exception as e:
            print(f"Error processing image from S3: {e}")

    db.image.update(
        where={"id": image.id},
        data={
            "detectionsProcessed": True,
            "width": image_width,
            "height": image_height,
        },
    )
    print("Marked image as detectionsProcessed.")

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "message": "Successfully processed event and called endpoint.",
                "endpoint_response": response.text,
            }
        ),
    }
