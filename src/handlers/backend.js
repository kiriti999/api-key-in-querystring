const axios = require('axios');
var http = require('http');

exports.lambda_handler = async (event) => {
    console.log('backend:: lambda_handler:: event: ', event);
    let ip;
    try {
        ip = await axios.get('http://checkip.amazonaws.com/');
        console.log('backend:: lambda_handler:: ip:', ip);
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