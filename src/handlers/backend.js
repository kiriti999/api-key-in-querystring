const axios = require('axios');

exports.lambda_handler = async (event) => {
    console.log('lambda_handler:: event: ', event);
    let ip;
    try {
        ip = await axios.get('http://checkip.amazonaws.com/');
    } catch (error) {
        console.error('error', error);
        throw new Error('Backend error...');
    }
    return {
        "statusCode": 200,
        "body": JSON.stringify({
            "message": "Hello from Lambda backend.",
            "yourIpAddress": ip.text.replace("\n", "")
        })
    };
};