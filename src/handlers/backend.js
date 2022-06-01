const axios = require('axios');
var http = require('http');

exports.lambda_handler = async (event) => {
    console.log('backend:: lambda_handler:: event: ', event);
    let ip;
    try {
        const result = await axios.get('http://checkip.amazonaws.com/');
        ip = result.data;
        console.log('backend:: lambda_handler:: ip data', ip);
    } catch (error) {
        console.error('backend:: lambda_handler::', error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(ip)
    }
    // return {
    //     "statusCode": 200,
    //     "body": {
    //         "message": "Hello from Lambda backend.",
    //         "yourIpAddress": ip
    //     }
    // };
};