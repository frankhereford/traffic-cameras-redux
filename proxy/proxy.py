import json

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
        
        # TODO: Add your business logic here
        
        # Example success response
        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Function executed successfully!',
                'input': event
            })
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

