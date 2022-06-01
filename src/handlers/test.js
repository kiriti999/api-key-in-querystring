var methods = [
    {
        resourceArn: 'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/GET/auth',
        conditions: []
    },
    {
        resourceArn: 'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/GET/shortfunnel-health',
        conditions: []
    },
    {
        resourceArn: 'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/GET/shortfunnel-energy',
        conditions: []
    },
    {
        resourceArn: 'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/POST/shortfunnel-health',
        conditions: []
    },
    {
        resourceArn: 'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/POST/shortfunnel-energy',
        conditions: []
    }
];

var effect = "allow";
var statement = {
    "Action": "execute-api:Invoke",
    "Effect": effect.slice(0, 1).toUpperCase() + effect.slice(1).toLowerCase(),
    "Resource": []
};

for (let index = 0; index < methods.length; index++) {
    const curMethod = methods[index];
    console.log('cur ', curMethod);
    if (curMethod["conditions"] === null || curMethod["conditions"].length === 0) {
        statement["Resource"].push(curMethod["resourceArn"]);
    }
}