import json

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
    message = event["Records"][0]["s3"]["object"]["key"]
    print("Received event: " + message)
    return {
        "statusCode": 200,
        "body": json.dumps({"message": message}),
    } 