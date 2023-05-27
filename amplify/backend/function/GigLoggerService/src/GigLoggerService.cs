using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Google.Apis.Sheets.v4;
using Microsoft.Extensions.DependencyInjection;

// https://aws.amazon.com/blogs/developer/introducing-net-core-support-for-aws-amplify-backend-functions/
// https://code-maze.com/google-sheets-api-with-net-core/
// https://github.com/awsdocs/aws-lambda-developer-guide/tree/main/sample-apps/blank-csharp/src/blank-csharp

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

// If you rename this namespace, you will need to update the invocation shim
// to match if you intend to test the function with 'amplify mock function'
namespace GigLoggerService
{
  // If you rename this class, you will need to update the invocation shim
  // to match if you intend to test the function with 'amplify mock function'
  public class GigLoggerService
    {

        private static ServiceProvider ServiceProvider { get; set; }

        public GigLoggerService()
        {
            var services = new ServiceCollection();
            ConfigureServices(services);
            ServiceProvider = services.BuildServiceProvider();
        }

        /// <summary>
        /// A Lambda function to respond to HTTP Get methods from API Gateway
        /// </summary>
        /// <param name="request"></param>
        /// <returns>The list of blogs</returns>
        /// <remarks>
        /// If you rename this function, you will need to update the invocation shim
        /// to match if you intend to test the function with 'amplify mock function'
        /// </remarks>
#pragma warning disable CS1998
        public async Task<APIGatewayProxyResponse> LambdaHandler(APIGatewayProxyRequest request, ILambdaContext context, GoogleSheetsHelper googleSheetsHelper)
        {
            var response = new APIGatewayProxyResponse {
                Headers = new Dictionary<string, string> {
                    { "Access-Control-Allow-Origin", "*" },
                    { "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" }
                }
            };

            string contentType = null;
            request.Headers?.TryGetValue("Content-Type", out contentType);
            SpreadsheetsResource.ValuesResource _googleSheetValues;

            switch (request.HttpMethod) {
                case "GET":
                    context.Logger.LogLine($"Get Request: {request.Path}\n");
                    _googleSheetValues = googleSheetsHelper.Service.Spreadsheets.Values;

                    response.StatusCode = (int)HttpStatusCode.OK;
                    response.Body = "{ \"message\": \"Hello AWS Serverless " + request.PathParameters["id"] +" \" }";
                    response.Headers["Content-Type"] = "application/json";
                    break;
                case "POST":
                    context.Logger.LogLine($"Post Request: {request.Path}\n");
                    if (!String.IsNullOrEmpty(contentType)) {
                        context.Logger.LogLine($"Content type: {contentType}");
                    }
                    context.Logger.LogLine($"Body: {request.Body}");
                    response.StatusCode = (int)HttpStatusCode.OK;
                    break;
                case "PUT":
                    context.Logger.LogLine($"Put Request: {request.Path}\n");
                    if (!String.IsNullOrEmpty(contentType)) {
                        context.Logger.LogLine($"Content type: {contentType}");
                    }
                    context.Logger.LogLine($"Body: {request.Body}");
                    response.StatusCode = (int)HttpStatusCode.OK;
                    break;
                case "DELETE":
                    context.Logger.LogLine($"Delete Request: {request.Path}\n");
                    response.StatusCode = (int)HttpStatusCode.OK;
                    break;
                default:
                    context.Logger.LogLine($"Unrecognized verb {request.HttpMethod}\n");
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    break;
            }

            return response;
        }

        /// <summary>
        /// Configure whatever dependency injection you like here
        /// </summary>
        /// <param name="services"></param>
        private static void ConfigureServices(IServiceCollection services)
        {
            // add dependencies here ex: Logging, IMemoryCache, Interface mapping to concrete class, etc...

            // add a hook to your class that will actually do the application logic
            services.AddTransient<GigLoggerService>();
        }

        /// <summary>
        /// Since we don't want to dispose of the ServiceProvider in the FunctionHandler, we will
        /// at least try to clean up after ourselves in the destructor for the class.
        /// </summary>
        ~GigLoggerService()
        {
            ServiceProvider.Dispose();
        }
    }
}
