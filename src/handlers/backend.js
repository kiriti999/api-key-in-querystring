const axios = require('axios');
var http = require('http');

exports.lambda_handler = async (event) => {
    console.log('backend:: lambda_handler:: event: ', event);
    let ip;
    let result = {};
    try {
        const result = await axios.get('http://checkip.amazonaws.com/');
        ip = result.data;
        console.log('backend:: lambda_handler:: ip data', ip);
        result = {
            statusCode: 200,
            body: JSON.stringify({
                "message": "Hello from Lambda backend.",
                "yourIpAddress": ip
            })
        }
    } catch (error) {
        console.error('backend:: lambda_handler::', error);
        result = {
            statusCode: 400,
            body: JSON.stringify({
                "message": `backend:: lambda_handler:: ${error}`
            })
        }
    }

    return result;
};