using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Google.Apis.Sheets.v4;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

// https://aws.amazon.com/blogs/developer/introducing-net-core-support-for-aws-amplify-backend-functions/
// https://code-maze.com/google-sheets-api-with-net-core/
// https://github.com/awsdocs/aws-lambda-developer-guide/tree/main/sample-apps/blank-csharp/src/blank-csharp
// https://nodogmablog.bryanhogan.net/2022/10/dependency-injection-with-the-lambda-annotations-library-for-net-part-1-lambda-applications/
// https://blog.steadycoding.com/using-singletons-in-net-core-in-aws-lambda/

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
        readonly ServiceProvider _serviceProvider;
        public SpreadsheetsResource.ValuesResource _googleSheetValues;
        public SheetEntity _sheet = new();
        public string _spreadsheetId = "";

        public GigLoggerService()
        {
            Console.WriteLine("Setting up the DI container");
            var serviceCollection = new ServiceCollection();
            Console.WriteLine("Adding a scoped service");
            serviceCollection.AddScoped(typeof(GoogleSheetsHelper));
            _serviceProvider = serviceCollection.BuildServiceProvider();
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
        public async Task<APIGatewayProxyResponse> LambdaHandler(APIGatewayProxyRequest request, ILambdaContext context)
        {
            var response = new APIGatewayProxyResponse {
                Headers = new Dictionary<string, string> {
                    { "Access-Control-Allow-Origin", "*" },
                    { "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" }
                }
            };

            using (var scope = _serviceProvider.CreateScope())
            {
                var googleSheetsService = scope.ServiceProvider.GetRequiredService<GoogleSheetsHelper>();
                _googleSheetValues = googleSheetsService.Service.Spreadsheets.Values;
            }

            // using var scope = ServiceProvider.CreateScope();
            // await scope.ServiceProvider.GetService<GigLoggerService>().Run(evnt);

            string contentType = null;
            request.Headers?.TryGetValue("Content-Type", out contentType);

            switch (request.HttpMethod) {
                case "GET":
                    context.Logger.LogLine($"Get Request: {request.Path}\n");
                    _spreadsheetId = request.PathParameters["id"];

                    _sheet.Addresses = GetAddresses();
                    _sheet.Names = GetNames();
                    _sheet.Places = GetPlaces();
                    _sheet.Services = GetServices();
                    _sheet.Shifts = GetShifts();
                    _sheet.Trips = GetTrips();
                    _sheet.Weekdays = GetWeekdays();

                    response.StatusCode = (int)HttpStatusCode.OK;
                    // response.Body = "{ \"message\": \"Hello AWS Serverless " + request.PathParameters["id"] +" \" }";
                    response.Body = JsonSerializer.Serialize(_sheet);
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

        private List<TripEntity> GetTrips() {
            var range = "Trips";
            var googleRequest = _googleSheetValues.Get(_spreadsheetId, range);
            var googleResponse = googleRequest.Execute();
            var values = googleResponse.Values;

            var trips = TripsMapper.MapFromRangeData(values);

            return trips;
        }

        private List<ShiftEntity> GetShifts() {
            var range = "Shifts";
            var googleRequest = _googleSheetValues.Get(_spreadsheetId, range);
            var googleResponse = googleRequest.Execute();
            var values = googleResponse.Values;

            var shifts = ShiftsMapper.MapFromRangeData(values);

            return shifts;
        }

        private List<AddressEntity> GetAddresses() {
            var range = "Addresses";
            var googleRequest = _googleSheetValues.Get(_spreadsheetId, range);
            var googleResponse = googleRequest.Execute();
            var values = googleResponse.Values;

            var addresses = AddressMapper.MapFromRangeData(values);

            return addresses;
        }

        private List<NameEntity> GetNames() {
            var range = "Names";
            var googleRequest = _googleSheetValues.Get(_spreadsheetId, range);
            var googleResponse = googleRequest.Execute();
            var values = googleResponse.Values;

            var names = NameMapper.MapFromRangeData(values);

            return names;
        }

        private List<PlaceEntity> GetPlaces() {
            var range = "Places";
            var googleRequest = _googleSheetValues.Get(_spreadsheetId, range);
            var googleResponse = googleRequest.Execute();
            var values = googleResponse.Values;

            var places = PlaceMapper.MapFromRangeData(values);

            return places;
        }

        private List<ServiceEntity> GetServices() {
            var range = "Services";
            var googleRequest = _googleSheetValues.Get(_spreadsheetId, range);
            var googleResponse = googleRequest.Execute();
            var values = googleResponse.Values;

            var services = ServiceMapper.MapFromRangeData(values);

            return services;
        }

        private List<WeekdayEntity> GetWeekdays() {
            var range = "Weekdays";
            var googleRequest = _googleSheetValues.Get(_spreadsheetId, range);
            var googleResponse = googleRequest.Execute();
            var values = googleResponse.Values;

            var weekdays = WeekdayMapper.MapFromRangeData(values);

            return weekdays;
        }

        /// <summary>
        /// Configure whatever dependency injection you like here
        /// </summary>
        /// <param name="services"></param>
        // private static void ConfigureServices(IServiceCollection services)
        // {
        //     // add dependencies here ex: Logging, IMemoryCache, Interface mapping to concrete class, etc...

        //     // add a hook to your class that will actually do the application logic
        //     services.AddTransient<GigLoggerService>();
        // }

        /// <summary>
        /// Since we don't want to dispose of the ServiceProvider in the FunctionHandler, we will
        /// at least try to clean up after ourselves in the destructor for the class.
        /// </summary>
        // ~GigLoggerService()
        // {
        //     ServiceProvider.Dispose();
        // }
    }
}
