console.log('Loading function');

exports.lambda_handler = function (event, context, callback) {
    console.log('Method ARN: ' + event.methodArn);
    var apiKey = event['queryStringParameters']['apiKey']
    var principalId = 'user|a1b2c3d4'
    // build apiOptions for the AuthPolicy
    var apiOptions = {};
    var tmp = event.methodArn.split(':');
    var apiGatewayArnTmp = tmp[5].split('/');
    var awsAccountId = tmp[4];

    apiOptions.region = tmp[3];
    apiOptions.restApiId = apiGatewayArnTmp[0];
    apiOptions.stage = apiGatewayArnTmp[1];
    var method = apiGatewayArnTmp[2];
    var resource = '/'; // root resource
    if (apiGatewayArnTmp[3]) {
        resource += apiGatewayArnTmp.slice(3, apiGatewayArnTmp.length).join('/');
    }

    // the example policy below denies access to all resources in the RestApi
    var policy = new AuthPolicy(principalId, awsAccountId, apiOptions);
    policy.restApiId = apiGatewayArnTmp[0]
    policy.region = tmp[3]
    policy.stage = apiGatewayArnTmp[1]
    AuthPolicy.prototype.allowMethod(AuthPolicy.HttpVerb.GET, '/auth')
    AuthPolicy.prototype.allowMethod(AuthPolicy.HttpVerb.GET, '/shortfunnel-health')
    AuthPolicy.prototype.allowMethod(AuthPolicy.HttpVerb.GET, '/shortfunnel-energy')
    AuthPolicy.prototype.allowMethod(AuthPolicy.HttpVerb.POST, '/shortfunnel-health')
    AuthPolicy.prototype.allowMethod(AuthPolicy.HttpVerb.POST, '/shortfunnel/energy')
    // policy.allowMethod(AuthPolicy.HttpVerb.GET, "/users/username");
    var authResponse = policy.build();

    // additional context is cached
    authResponse.context = {
        key: 'value', // $context.authorizer.key -> value
        number: 1,
        bool: true
    };

    usageIdentifierKey = apiKey

    authResponse['context'] = context
    authResponse['usageIdentifierKey'] = usageIdentifierKey

    callback(null, authResponse);
};

function AuthPolicy(principal, awsAccountId, apiOptions) {

    this.awsAccountId = awsAccountId;
    this.principalId = principal;
    this.version = "2012-10-17";
    this.pathRegex = new RegExp('^[/.a-zA-Z0-9-\*]+$');
    this.allowMethods = [];
    this.denyMethods = [];

    if (!apiOptions || !apiOptions.restApiId) {
        // Beware of using '*' since it will not simply mean any API Gateway API id, because stars will greedily expand over '/' or other separators.
        // See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details.
        this.restApiId = "<<restApiId>>";
    } else {
        this.restApiId = apiOptions.restApiId;
    }
    if (!apiOptions || !apiOptions.region) {
        this.region = "<<region>>";
    } else {
        this.region = apiOptions.region;
    }
    if (!apiOptions || !apiOptions.stage) {
        this.stage = "<<stage>>";
    } else {
        this.stage = apiOptions.stage;
    }
};

AuthPolicy.HttpVerb = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    HEAD: "HEAD",
    DELETE: "DELETE",
    OPTIONS: "OPTIONS",
    ALL: "*"
};

AuthPolicy.prototype = (function () {
    var addMethod = function (effect, verb, resource, conditions) {
        if (verb != "*" && !AuthPolicy.HttpVerb.hasOwnProperty(verb)) {
            throw new Error("Invalid HTTP verb " + verb + ". Allowed verbs in AuthPolicy.HttpVerb");
        }

        if (!this.pathRegex.test(resource)) {
            throw new Error("Invalid resource path: " + resource + ". Path should match " + this.pathRegex);
        }

        var cleanedResource = resource;
        if (resource.substring(0, 1) == "/") {
            cleanedResource = resource.substring(1, resource.length);
        }
        var resourceArn = "arn:aws:execute-api:" +
            this.region + ":" +
            this.awsAccountId + ":" +
            this.restApiId + "/" +
            this.stage + "/" +
            verb + "/" +
            cleanedResource;

        if (effect.toLowerCase() == "allow") {
            this.allowMethods.push({
                resourceArn: resourceArn,
                conditions: conditions
            });
        } else if (effect.toLowerCase() == "deny") {
            this.denyMethods.push({
                resourceArn: resourceArn,
                conditions: conditions
            })
        }
    };

    var getEmptyStatement = function (effect) {
        effect = effect.substring(0, 1).toUpperCase() + effect.substring(1, effect.length).toLowerCase();
        var statement = {};
        statement.Action = "execute-api:Invoke";
        statement.Effect = effect;
        statement.Resource = [];

        return statement;
    };

    var getStatementsForEffect = function (effect, methods) {
        var statements = [];

        if (methods.length > 0) {
            var statement = getEmptyStatement(effect);

            for (var i = 0; i < methods.length; i++) {
                var curMethod = methods[i];
                if (curMethod.conditions === null || curMethod.conditions.length === 0) {
                    statement.Resource.push(curMethod.resourceArn);
                } else {
                    var conditionalStatement = getEmptyStatement(effect);
                    conditionalStatement.Resource.push(curMethod.resourceArn);
                    conditionalStatement.Condition = curMethod.conditions;
                    statements.push(conditionalStatement);
                }
            }

            if (statement.Resource !== null && statement.Resource.length > 0) {
                statements.push(statement);
            }
        }

        return statements;
    };

    return {
        constructor: AuthPolicy,

        allowAllMethods: function () {
            addMethod.call(this, "allow", "*", "*", null);
        },

        denyAllMethods: function () {
            addMethod.call(this, "deny", "*", "*", null);
        },

        allowMethod: function (verb, resource) {
            addMethod.call(this, "allow", verb, resource, null);
        },

        denyMethod: function (verb, resource) {
            addMethod.call(this, "deny", verb, resource, null);
        },

        allowMethodWithConditions: function (verb, resource, conditions) {
            addMethod.call(this, "allow", verb, resource, conditions);
        },

        denyMethodWithConditions: function (verb, resource, conditions) {
            addMethod.call(this, "deny", verb, resource, conditions);
        },

        build: function () {
            if ((!this.allowMethods || this.allowMethods.length === 0) &&
                (!this.denyMethods || this.denyMethods.length === 0)) {
                throw new Error("No statements defined for the policy");
            }

            var policy = {};
            policy.principalId = this.principalId;
            var doc = {};
            doc.Version = this.version;
            doc.Statement = [];

            doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, "Allow", this.allowMethods));
            doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, "Deny", this.denyMethods));

            policy.policyDocument = doc;

            return policy;
        }
    };

})();