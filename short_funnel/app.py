import json
import requests
def lambda_handler(event, context):
    print('Backend event:: ', event)
    try:
        ip = requests.get("http://checkip.amazonaws.com/")
    except requests.RequestException as e:
        print('error in backend', e)
        raise e
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Hello from Lambda backend.",
             "yourIpAddress": ip.text.replace("\n", "")
        }),
    }
