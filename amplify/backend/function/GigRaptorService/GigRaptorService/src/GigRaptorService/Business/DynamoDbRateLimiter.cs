//using Amazon.DynamoDBv2;
//using Amazon.DynamoDBv2.Model;
//using System;
//using System.Collections.Generic;
//using System.Threading.Tasks;

//namespace GigRaptorService.Business;

//public class DynamoDbRateLimiter
//{
//    private readonly IAmazonDynamoDB _dynamoDbClient;
//    private readonly string _tableName;
//    private readonly int _maxRequests;
//    private readonly TimeSpan _timeWindow;

//    public DynamoDbRateLimiter(IAmazonDynamoDB dynamoDbClient, string tableName, int maxRequests, TimeSpan timeWindow)
//    {
//        _dynamoDbClient = dynamoDbClient;
//        _tableName = tableName;
//        _maxRequests = maxRequests;
//        _timeWindow = timeWindow;
//    }

//    public async Task<bool> IsRequestAllowedAsync(string spreadsheetId)
//    {
//        var now = DateTime.UtcNow;

//        // Get the current rate limit record for the spreadsheet ID
//        var response = await _dynamoDbClient.GetItemAsync(new GetItemRequest
//        {
//            TableName = _tableName,
//            Key = new Dictionary<string, AttributeValue>
//            {
//                { "SpreadsheetId", new AttributeValue { S = spreadsheetId } }
//            }
//        });

//        if (response.Item == null || !response.Item.ContainsKey("RequestCount"))
//        {
//            // No record exists, create a new one
//            await _dynamoDbClient.PutItemAsync(new PutItemRequest
//            {
//                TableName = _tableName,
//                Item = new Dictionary<string, AttributeValue>
//                {
//                    { "SpreadsheetId", new AttributeValue { S = spreadsheetId } },
//                    { "RequestCount", new AttributeValue { N = "1" } },
//                    { "LastRequestTime", new AttributeValue { S = now.ToString("o") } }
//                }
//            });
//            return true;
//        }

//        // Parse the existing record
//        var requestCount = int.Parse(response.Item["RequestCount"].N);
//        var lastRequestTime = DateTime.Parse(response.Item["LastRequestTime"].S);

//        // Check if the time window has passed
//        if (now - lastRequestTime > _timeWindow)
//        {
//            // Reset the rate limit
//            await _dynamoDbClient.UpdateItemAsync(new UpdateItemRequest
//            {
//                TableName = _tableName,
//                Key = new Dictionary<string, AttributeValue>
//                {
//                    { "SpreadsheetId", new AttributeValue { S = spreadsheetId } }
//                },
//                AttributeUpdates = new Dictionary<string, AttributeValueUpdate>
//                {
//                    { "RequestCount", new AttributeValueUpdate { Action = "PUT", Value = new AttributeValue { N = "1" } } },
//                    { "LastRequestTime", new AttributeValueUpdate { Action = "PUT", Value = new AttributeValue { S = now.ToString("o") } } }
//                }
//            });
//            return true;
//        }

//        // Check if the request count exceeds the limit
//        if (requestCount >= _maxRequests)
//        {
//            return false;
//        }

//        // Increment the request count
//        await _dynamoDbClient.UpdateItemAsync(new UpdateItemRequest
//        {
//            TableName = _tableName,
//            Key = new Dictionary<string, AttributeValue>
//            {
//                { "SpreadsheetId", new AttributeValue { S = spreadsheetId } }
//            },
//            AttributeUpdates = new Dictionary<string, AttributeValueUpdate>
//            {
//                { "RequestCount", new AttributeValueUpdate { Action = "ADD", Value = new AttributeValue { N = "1" } } }
//            }
//        });

//        return true;
//    }
//}
