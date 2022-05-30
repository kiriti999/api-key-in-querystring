import * as json from 'json';
import * as axios from 'axios';

function lambda_handler(event, context) {
    var ip;
    console.log("Backend event:: ", event);

    try {
        ip = requests.get("http://checkip.amazonaws.com/");
    } catch (e) {
        if (e instanceof requests.RequestException) {
            console.log("error in backend", e);
            throw e;
        } else {
            throw e;
        }
    }

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Hello from Lambda backend.",
            "yourIpAddress": ip.text.replace("\n", "")
        })
    };
}
