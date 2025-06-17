import json
import os
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

    print("Received response: " + response.text)

    response_json = json.loads(response.text)
    detections = response_json["detections"]
    for detection in detections:
        print(detection["label"])

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "message": "Successfully processed event and called endpoint.",
                "endpoint_response": response.text,
            }
        ),
    }
