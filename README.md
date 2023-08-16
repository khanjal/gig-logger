# Gig-Logger
For logging gig work

## UI

### Setup

### Run
```ng serve```

## Service

### Setup

```bash
aws lambda add-permission 
--function-name "arn:aws:lambda:us-east-1:***REMOVED***:function:GigLoggerService-staging:${stageVariables.lambdaAlias}" 
--source-arn "arn:aws:execute-api:us-east-1:***REMOVED***:atftzfc4p0/*/*/sheet/*/*"  --principal apigateway.amazonaws.com  
--statement-id 83d9a165-c46a-406f-abe9-a4ed18c4ec18 
--action lambda:InvokeFunction 
```

### Push:


```amplify push```

