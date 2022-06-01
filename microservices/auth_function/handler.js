export function lambda_handler(event, context) {
    let apiGatewayArnTmp, apiKey, authResponse, awsAccountId, policy, principalId, tmp, usageIdentifierKey;
    console.log("event ", event);
    apiKey = event["queryStringParameters"]["apiKey"];
    principalId = "user|a1b2c3d4";
    tmp = event["methodArn"].split(":");
    apiGatewayArnTmp = tmp[5].split("/");
    awsAccountId = tmp[4];
    policy = new AuthPolicy(principalId, awsAccountId);
    policy.restApiId = apiGatewayArnTmp[0];
    policy.region = tmp[3];
    policy.stage = apiGatewayArnTmp[1];
    policy.allowMethod(HttpVerb.GET, "/auth");
    policy.allowMethod(HttpVerb.GET, "/shortfunnel-health");
    policy.allowMethod(HttpVerb.GET, "/shortfunnel-energy");
    policy.allowMethod(HttpVerb.POST, "/shortfunnel-health");
    policy.allowMethod(HttpVerb.POST, "/shortfunnel-energy");
    authResponse = policy.build();
    context = {
        "SomeKey": "SomeValue"
    };
    usageIdentifierKey = apiKey;
    authResponse["context"] = context;
    authResponse["usageIdentifierKey"] = usageIdentifierKey;
    console.log(authResponse);
    return authResponse;
}
const HttpVerb = {
    "ALL": "*",
    "POST": "POST",
    "GET": "GET"
};
var AuthPolicy = /** @class */ (function () {
    function AuthPolicy(principal, awsAccountId) {
        this.version = "2012-10-17";
        this.pathRegex = "/[^/][a-zA-Z0-9]+/?[^/][a-zA-Z0-9-\*]+";
        this.restApiId = "<<restApiId>>";
        this.region = "<<region>>";
        this.stage = "<<stage>>";
        this.awsAccountId = awsAccountId;
        this.principalId = principal;
        this.allowMethods = [];
        this.denyMethods = [];
    }
    AuthPolicy.prototype._addMethod = function (effect, verb, resource, conditions) {
        var resourceArn, resourcePattern;
        if (verb !== "*" && !(verb in HttpVerb)) {
            console.log("Invalid verb ", verb);
            throw new Error("Invalid HTTP verb " + verb + ". Allowed verbs in HttpVerb class");
        }
        if (!this.pathRegex.test(resourcePattern)) {
            console.log("Invalid resource path ", resource);
            throw new Error("Invalid resource path: " + resource + ". Path should match " + this.pathRegex);
        }
        if (resource.slice(0, 1) === "/") {
            resource = resource.slice(1);
        }
        resourceArn = "arn:aws:execute-api:" + this.region + ":" + this.awsAccountId + ":" + this.restApiId + "/" + this.stage + "/" + verb + "/" + resource;
        if (effect.lower() === "allow") {
            this.allowMethods.append({
                "resourceArn": resourceArn,
                "conditions": conditions
            });
        }
        else {
            if (effect.lower() === "deny") {
                this.denyMethods.append({
                    "resourceArn": resourceArn,
                    "conditions": conditions
                });
            }
        }
    };
    AuthPolicy.prototype._getEmptyStatement = function (effect) {
        var statement = {
            "Action": "execute-api:Invoke",
            "Effect": effect.slice(0, 1).upper() + effect.slice(1).lower(),
            "Resource": []
        };
        return statement;
    };
    AuthPolicy.prototype._getStatementForEffect = function (effect, methods) {
        var conditionalStatement, statement, statements;
        statements = [];
        if (methods.length > 0) {
            statement = this._getEmptyStatement(effect);
            for (var curMethod in methods) {
                if (curMethod["conditions"] === null || curMethod["conditions"].length === 0) {
                    statement["Resource"].append(curMethod["resourceArn"]);
                }
                else {
                    conditionalStatement = this._getEmptyStatement(effect);
                    conditionalStatement["Resource"].append(curMethod["resourceArn"]);
                    conditionalStatement["Condition"] = curMethod["conditions"];
                    statements.append(conditionalStatement);
                }
            }
            statements.append(statement);
            console.log("statements ", statements);
        }
        return statements;
    };
    AuthPolicy.prototype.allowAllMethods = function () {
        this._addMethod("Allow", HttpVerb.ALL, "*", []);
    };
    AuthPolicy.prototype.denyAllMethods = function () {
        this._addMethod("Deny", HttpVerb.ALL, "*", []);
    };
    AuthPolicy.prototype.allowMethod = function (verb, resource) {
        this._addMethod("Allow", verb, resource, []);
    };
    AuthPolicy.prototype.denyMethod = function (verb, resource) {
        this._addMethod("Deny", verb, resource, []);
    };
    AuthPolicy.prototype.allowMethodWithConditions = function (verb, resource, conditions) {
        this._addMethod("Allow", verb, resource, conditions);
    };
    AuthPolicy.prototype.denyMethodWithConditions = function (verb, resource, conditions) {
        this._addMethod("Deny", verb, resource, conditions);
    };
    AuthPolicy.prototype.build = function () {
        var policy;
        if ((this.allowMethods === null || this.allowMethods.length === 0) && (this.denyMethods === null || this.denyMethods.length === 0)) {
            console.log("No statements defined for the policy");
            throw new Error("No statements defined for the policy");
        }
        policy = {
            "principalId": this.principalId,
            "policyDocument": {
                "Version": this.version,
                "Statement": []
            }
        };
        policy["policyDocument"]["Statement"].concat(this._getStatementForEffect("Allow", this.allowMethods));
        policy["policyDocument"]["Statement"].concat(this._getStatementForEffect("Deny", this.denyMethods));
        return policy;
    };
    return AuthPolicy;
}());
