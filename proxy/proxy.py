import json
import urllib.request
import base64

def handler(event, context):
    """
    Main Lambda handler function
    Parameters:
        event: Dict containing the Lambda function event data
        context: Lambda runtime context
    Returns:
        Dict containing status message
    """
    try:
        print("Received event: " + json.dumps(event, indent=2))
        
        # Download the image from the Austin Mobility CCTV feed
        image_url = 'https://cctv.austinmobility.io/image/395.jpg'
        with urllib.request.urlopen(image_url) as img_response:
            image_bytes = img_response.read()

        # Lambda/HTTP API expects binary payloads to be base64-encoded
        encoded_image = base64.b64encode(image_bytes).decode('utf-8')

        response = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'image/jpeg'
            },
            # Indicates to API Gateway that the body is base64-encoded binary data
            'isBase64Encoded': True,
            'body': encoded_image
        }

        return response
            
    except Exception as e:
        # Handle any exceptions that occur
        print(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

