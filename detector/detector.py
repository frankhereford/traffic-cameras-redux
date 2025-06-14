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
    print("Received event: " + json.dumps(event, indent=2))
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Hello from detector!"}),
    } 