"""
Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
     http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
"""
from __future__ import print_function
import re

#The sole purpose of this function is to extract & return the apiKey param.

def lambda_handler(event, context):
    print("event ", event)
    try:
        print("Method ARN: " + event['methodArn'])
        apiKey = event['queryStringParameters']['apiKey']
        principalId = "user|a1b2c3d4"
        tmp = event['methodArn'].split(':')
        apiGatewayArnTmp = tmp[5].split('/')
        awsAccountId = tmp[4]

        policy = AuthPolicy(principalId, awsAccountId)
        policy.restApiId = apiGatewayArnTmp[0]
        policy.region = tmp[3]
        policy.stage = apiGatewayArnTmp[1]
        policy.allowMethod('POST', '/shortfunnel')
        policy.allowMethod('POST', '/shortfunnel/*')
        policy.allowMethod('POST', '/shortfunnel/energy')
        policy.allowMethod('POST', '/shortfunnel-health')
        authResponse = policy.build()
        context = {
            'SomeKey': 'SomeValue'
        }

        usageIdentifierKey = apiKey

        authResponse['context'] = context
        authResponse['usageIdentifierKey'] = usageIdentifierKey
        print(authResponse)
    except:
        print("lambda_handler:: An exception occurred")

    return authResponse

class HttpVerb:
    GET     = "GET"
    POST    = "POST"
    PUT     = "PUT"
    PATCH   = "PATCH"
    HEAD    = "HEAD"
    DELETE  = "DELETE"
    OPTIONS = "OPTIONS"
    ALL     = "*"

class AuthPolicy(object):
    """The AWS account id the policy will be generated for. This is used to create the method ARNs."""
    awsAccountId = ""
    """The principal used for the policy, this should be a unique identifier for the end user."""
    principalId = ""
    """The policy version used for the evaluation. This should always be '2012-10-17'"""
    version = "2012-10-17"
    """The regular expression used to validate resource paths for the policy"""
    # pathRegex = "^[/.a-zA-Z0-9-\*]+$"
    pathRegex = "/[^/]+/?[^/\*]+"
    # pathRegex = "/[^/][a-zA-Z0-9]+/?[^/][a-zA-Z0-9-\*]+"

    """these are the internal lists of allowed and denied methods. These are lists
    of objects and each object has 2 properties: A resource ARN and a nullable
    conditions statement.
    the build method processes these lists and generates the appropriate
    statements for the final policy"""
    allowMethods = []
    denyMethods = []


    restApiId = "<<restApiId>>"
    """ Replace the placeholder value with a default API Gateway API id to be used in the policy.
    Beware of using '*' since it will not simply mean any API Gateway API id, because stars will greedily expand over '/' or other separators.
    See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details. """

    region = "<<region>>"
    """ Replace the placeholder value with a default region to be used in the policy.
    Beware of using '*' since it will not simply mean any region, because stars will greedily expand over '/' or other separators.
    See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details. """

    stage = "<<stage>>"
    """ Replace the placeholder value with a default stage to be used in the policy.
    Beware of using '*' since it will not simply mean any stage, because stars will greedily expand over '/' or other separators.
    See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details. """

    def __init__(self, principal, awsAccountId):
        try:
            self.awsAccountId = awsAccountId
            self.principalId = principal
            self.allowMethods = []
            self.denyMethods = []
        except:
            print("__init__:: An exception occurred")

    def _addMethod(self, effect, verb, resource, conditions):
        try:
            """Adds a method to the internal lists of allowed or denied methods. Each object in
            the internal list contains a resource ARN and a condition statement. The condition
            statement can be null."""
            if verb != "*" and not hasattr(HttpVerb, verb):
                print("Invalid verb ", verb)
                raise NameError("Invalid HTTP verb " + verb + ". Allowed verbs in HttpVerb class")
            resourcePattern = re.compile(self.pathRegex)
            if not resourcePattern.match(resource):
                print("Invalid resource path ", resource)
                raise NameError("Invalid resource path: " + resource + ". Path should match " + self.pathRegex)

            if resource[:1] == "/":
                resource = resource[1:]

            resourceArn = ("arn:aws:execute-api:" +
                self.region + ":" +
                self.awsAccountId + ":" +
                self.restApiId + "/" +
                self.stage + "/" +
                verb + "/" +
                resource)

            if effect.lower() == "allow":
                self.allowMethods.append({
                    'resourceArn' : resourceArn,
                    'conditions' : conditions
                })
            elif effect.lower() == "deny":
                self.denyMethods.append({
                    'resourceArn' : resourceArn,
                    'conditions' : conditions
                })
        except:
            print("_addMethod:: An exception occurred")

    def _getEmptyStatement(self, effect):
        try:
            """Returns an empty statement object prepopulated with the correct action and the
            desired effect."""
            statement = {
                'Action': 'execute-api:Invoke',
                'Effect': effect[:1].upper() + effect[1:].lower(),
                'Resource': []
            }
        except:
            print("_getEmptyStatement:: An exception occurred")

        return statement

    def _getStatementForEffect(self, effect, methods):
        try:
            """This function loops over an array of objects containing a resourceArn and
            conditions statement and generates the array of statements for the policy."""
            statements = []

            if len(methods) > 0:
                statement = self._getEmptyStatement(effect)

                for curMethod in methods:
                    if curMethod['conditions'] is None or len(curMethod['conditions']) == 0:
                        statement['Resource'].append(curMethod['resourceArn'])
                    else:
                        conditionalStatement = self._getEmptyStatement(effect)
                        conditionalStatement['Resource'].append(curMethod['resourceArn'])
                        conditionalStatement['Condition'] = curMethod['conditions']
                        statements.append(conditionalStatement)

                statements.append(statement)

                print('statements ', statements)
        except:
            print("_getStatementForEffect:: An exception occurred")

        return statements

    def allowAllMethods(self):
        try:
            """Adds a '*' allow to the policy to authorize access to all methods of an API"""
            self._addMethod("Allow", HttpVerb.ALL, "*", [])
        except:
            print("An exception occurred")

    def denyAllMethods(self):
        try:
            """Adds a '*' allow to the policy to deny access to all methods of an API"""
            self._addMethod("Deny", HttpVerb.ALL, "*", [])
        except:
            print("An exception occurred")

    def allowMethod(self, verb, resource):
        try:
            """Adds an API Gateway method (Http verb + Resource path) to the list of allowed
            methods for the policy"""
            self._addMethod("Allow", verb, resource, [])
        except:
            print("allowMethod:: An exception occurred")

    def denyMethod(self, verb, resource):
        try:
            """Adds an API Gateway method (Http verb + Resource path) to the list of denied
            methods for the policy"""
            self._addMethod("Deny", verb, resource, [])
        except:
            print("denyMethod:: An exception occurred")


    def allowMethodWithConditions(self, verb, resource, conditions):
        try:
            """Adds an API Gateway method (Http verb + Resource path) to the list of allowed
            methods and includes a condition for the policy statement. More on AWS policy
            conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition"""
            self._addMethod("Allow", verb, resource, conditions)
        except:
            print("allowMethodWithConditions:: An exception occurred")

    def denyMethodWithConditions(self, verb, resource, conditions):
        try:
            """Adds an API Gateway method (Http verb + Resource path) to the list of denied
            methods and includes a condition for the policy statement. More on AWS policy
            conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition"""
            self._addMethod("Deny", verb, resource, conditions)
        except:
            print("denyMethodWithConditions:: An exception occurred")

    def build(self):
        try:
            """Generates the policy document based on the internal lists of allowed and denied
            conditions. This will generate a policy with two main statements for the effect:
            one statement for Allow and one statement for Deny.
            Methods that includes conditions will have their own statement in the policy."""
            if ((self.allowMethods is None or len(self.allowMethods) == 0) and
                (self.denyMethods is None or len(self.denyMethods) == 0)):
                print("No statements defined for the policy")
                raise NameError("No statements defined for the policy")

            policy = {
                'principalId' : self.principalId,
                'policyDocument' : {
                    'Version' : self.version,
                    'Statement' : []
                }
            }

            policy['policyDocument']['Statement'].extend(self._getStatementForEffect("Allow", self.allowMethods))
            policy['policyDocument']['Statement'].extend(self._getStatementForEffect("Deny", self.denyMethods))
        except:
            print("build:: An exception occurred")

        return policy