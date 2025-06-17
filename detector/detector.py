import json
import os
import re
import jwt
import requests
from prisma import Prisma


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
    print(f"Received key: {key}")

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

    image = db.image.find_unique(where={"hash": image_hash})
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

    for detection in detections:
        box = detection["box"]
        # width = box["xMax"] - box["xMin"]
        # height = box["yMax"] - box["yMin"]
        width = response_json.get("width")
        height = response_json.get("height")
        width_log = f"{width:.0f}" if width is not None else "N/A"
        height_log = f"{height:.0f}" if height is not None else "N/A"
        print(
            f'  - Creating detection: "{detection["label"]}" → {box["xMin"]:.0f},{box["yMin"]:.0f} : {box["xMax"]:.0f},{box["yMax"]:.0f} ({width_log} x {height_log})'
        )
        db.detection.create(
            data={
                "label": detection["label"],
                "confidence": detection["confidence"],
                "xMin": int(box["xMin"]),
                "yMin": int(box["yMin"]),
                "xMax": int(box["xMax"]),
                "yMax": int(box["yMax"]),
                "image": {"connect": {"id": image.id}},
            }
        )

    db.image.update(
        where={"id": image.id},
        data={
            "detectionsProcessed": True,
            "width": response_json.get("width"),
            "height": response_json.get("height"),
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
