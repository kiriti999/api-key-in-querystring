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

var statements = [
    {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
            'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/GET/auth',
            'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/GET/shortfunnel-health',
            'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/GET/shortfunnel-energy',
            'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/POST/shortfunnel-health',
            'arn:aws:execute-api:ap-southeast-2:327303463717:1ku193eqf8/dev/POST/shortfunnel-energy'
        ]
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
    if (curMethod["conditions"] === null || curMethod["conditions"].length === 0) {
        statement["Resource"].push(curMethod["resourceArn"]);
    }
}

policy = {
    "principalId": this.principalId,
    "policyDocument": {
        "Version": this.version,
        "Statement": []
    }
};
policy["policyDocument"]["Statement"].concat(statements[0].Resource);

var resources = statements[0].Resource;
var result = (policy.policyDocument.Statement.concat(...resources));
console.log('result ', result);

console.log('policy ', policy);

var ip = {
    status: 200,
    statusText: 'OK',
    data: '54.206.74.254\n'
}

console.log('ip ', ip.data);