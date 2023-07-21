using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

using Microsoft.Extensions.DependencyInjection;

using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;

using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;
using static Google.Apis.Sheets.v4.SpreadsheetsResource.ValuesResource;

// https://aws.amazon.com/blogs/developer/introducing-net-core-support-for-aws-amplify-backend-functions/
// https://code-maze.com/google-sheets-api-with-net-core/
// https://github.com/awsdocs/aws-lambda-developer-guide/tree/main/sample-apps/blank-csharp/src/blank-csharp
// https://nodogmablog.bryanhogan.net/2022/10/dependency-injection-with-the-lambda-annotations-library-for-net-part-1-lambda-applications/
// https://blog.steadycoding.com/using-singletons-in-net-core-in-aws-lambda/

// C# Context Info
// https://docs.aws.amazon.com/lambda/latest/dg/csharp-context.html

// How to use API Gateway stage variables to call specific Lambda alias?
// https://www.youtube.com/watch?v=mwD5wiP1FJ8

// How to add a sheet in google sheets API v4 in C#?
// https://stackoverflow.com/questions/37623191/how-to-add-a-sheet-in-google-sheets-api-v4-in-c

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
        public SpreadsheetsResource.SheetsResource _googleSheetSheets;
        public SheetsService _googleSheetService;
        public string _googleSheetName;
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
            context.Logger.LogLine($"Invoked Arn: {context.InvokedFunctionArn}");
            var response = new APIGatewayProxyResponse {
                Headers = new Dictionary<string, string> {
                    { "Access-Control-Allow-Origin", "*" },
                    { "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" }
                }
            };

            _sheet = new();

            using (var scope = _serviceProvider.CreateScope())
            {
                var googleSheetsService = scope.ServiceProvider.GetRequiredService<GoogleSheetsHelper>();
                _googleSheetValues = googleSheetsService.Service.Spreadsheets.Values;
                _googleSheetSheets = googleSheetsService.Service.Spreadsheets.Sheets;
                _googleSheetService = googleSheetsService.Service;
            }

            // using var scope = ServiceProvider.CreateScope();
            // await scope.ServiceProvider.GetService<GigLoggerService>().Run(evnt);

            string contentType = null;
            string action = null;
            request.Headers?.TryGetValue("Content-Type", out contentType);

            switch (request.HttpMethod) {
                case "GET":
                    // context.Logger.LogLine($"Get Request: {request.Path}\n");
                    context.Logger.LogLine("Get Request");
                    _spreadsheetId = request.PathParameters["id"];
                    action = request.PathParameters["action"];
                    context.Logger.LogLine($"Action: {action}");

                    if (action == null) {
                        response.Body = "{ \"message\": \"Choose an action for " + request.PathParameters["id"] +"\" }";
                    }

                    // Console.Write(JsonSerializer.Serialize(request.PathParameters));

                    switch (action)
                    {
                        case "primary":
                        case "secondary":
                            LoadSpreadSheetData(action);
                            break;
                        case "check":
                            CheckSpreadSheet();
                            break;
                        case "generate":
                            break;
                        case "warmup":
                            WarmupLambda();
                            break;
                    }

                    response.StatusCode = (int)HttpStatusCode.OK;
                    response.Body = JsonSerializer.Serialize(_sheet);
                    response.Headers["Content-Type"] = "application/json";
                    break;
                case "POST":
                    // context.Logger.LogLine($"Post Request: {request.Path}\n");
                    context.Logger.LogLine("Post Request");

                    _spreadsheetId = request.PathParameters["id"];
                    action = request.PathParameters["action"];

                    if (!String.IsNullOrEmpty(contentType)) {
                        context.Logger.LogLine($"Content type: {contentType}");
                    }
                    // context.Logger.LogLine($"Body: {request.Body}");
                    context.Logger.LogLine($"Action: {action}");

                    switch (action)
                    {
                        case "trips":
                            
                            var sheetData = JsonSerializer.Deserialize<SheetEntity>(request.Body);
                            context.Logger.LogDebug(JsonSerializer.Serialize(sheetData));

                            if (sheetData != null) {
                                SaveTripData(sheetData);
                            }
                            
                        break;
                    }

                    response.StatusCode = (int)HttpStatusCode.OK;
                    break;
                case "PUT":
                    context.Logger.LogLine($"Put Request: {request.Path}\n");
                    if (!String.IsNullOrEmpty(contentType)) {
                        context.Logger.LogLine($"Content type: {contentType}");
                    }
                    context.Logger.LogLine($"Body: {request.Body}");

                    // var range = $"{SHEET_NAME}!A{rowId}:D{rowId}";
                    // var valueRange = new ValueRange
                    // {
                    //     Values = ItemsMapper.MapToRangeData(item)
                    // };
                    // var updateRequest = _googleSheetValues.Update(valueRange, SPREADSHEET_ID, range);
                    // updateRequest.ValueInputOption = UpdateRequest.ValueInputOptionEnum.USERENTERED;
                    // updateRequest.Execute();

                    response.StatusCode = (int)HttpStatusCode.OK;
                    break;
                case "DELETE":
                    context.Logger.LogLine($"Delete Request: {request.Path}\n");

                    // var range = $"{SHEET_NAME}!A{rowId}:D{rowId}";
                    // var requestBody = new ClearValuesRequest();
                    // var deleteRequest = _googleSheetValues.Clear(requestBody, SPREADSHEET_ID, range);
                    // deleteRequest.Execute();
                    
                    response.StatusCode = (int)HttpStatusCode.OK;
                    break;
                default:
                    context.Logger.LogLine($"Unrecognized verb {request.HttpMethod}\n");
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    break;
            }

            return response;
        }

    private void SaveTripData(SheetEntity sheetData)
    {
        // Create & save trip rows.
        var tripRange = $"{SheetEnum.Trips.DisplayName()}!A1:ZZ1";
        var tripHeaders = GetSheetData(tripRange)[0];
        var trips = TripMapper.MapToRangeData(sheetData.Trips, tripHeaders);
        // context.Logger.LogDebug(JsonSerializer.Serialize(trips));

        if (trips.Count > 0) {
            var valueRange = new ValueRange { Values = trips };
            AppendData(valueRange, tripRange);
        }

         // Create & save shift rows.
        var shiftRange = $"{SheetEnum.Shifts.DisplayName()}!A1:ZZ1";
        var shiftHeaders = GetSheetData(shiftRange)[0];
        var shifts = ShiftMapper.MapToRangeData(sheetData.Shifts, shiftHeaders);
        // context.Logger.LogDebug(JsonSerializer.Serialize(shifts));

        if (shifts.Count > 0) {
            var valueRange = new ValueRange { Values = shifts };
            AppendData(valueRange, shiftRange);
        }
    }

    private void AppendData(ValueRange valueRange, string range)
    {
        var appendRequest = _googleSheetValues.Append(valueRange, _spreadsheetId, range);
        appendRequest.ValueInputOption = AppendRequest.ValueInputOptionEnum.USERENTERED;
        appendRequest.Execute();
    }

    private void CheckSpreadSheet()
    {
        foreach (var name in Enum.GetNames<SheetEnum>())
        {
            SheetEnum sheetEnum = (SheetEnum)Enum.Parse(typeof(SheetEnum), name);

            GetSheetData(sheetEnum.DisplayName());

            Console.WriteLine(name);
        }
    }

    private void LoadSpreadSheetData(string action)
    {
        var sheets = new List<SheetEnum>();
        LoadSpreadSheetProperties();

        switch (action)
        {
            case "primary":
                sheets.Add(SheetEnum.Addresses);
                sheets.Add(SheetEnum.Names);
                sheets.Add(SheetEnum.Places);
                sheets.Add(SheetEnum.Regions);
                sheets.Add(SheetEnum.Services);
                sheets.Add(SheetEnum.Shifts);
                sheets.Add(SheetEnum.Trips);
                sheets.Add(SheetEnum.Types);
                sheets.Add(SheetEnum.Weekdays);
            break;
            
            case "secondary":
                sheets.Add(SheetEnum.Addresses);
                sheets.Add(SheetEnum.Names);
                sheets.Add(SheetEnum.Trips);
            break;
        }

        LoadBatchData(sheets);
    }

    private void LoadSpreadSheetProperties()
    {
        // var googleRequest = _googleSheetValues.Get;
        // var googleResponse = googleRequest.Execute();
        // matchedValues = googleResponse.ValueRanges;
        Console.WriteLine($"Google Sheet Name: {_googleSheetName}");
    }

    private void LoadBatchData(List<SheetEnum> sheets)
    {
        var body = new BatchGetValuesByDataFilterRequest();
        body.DataFilters = new List<DataFilter>();

        foreach (var sheet in sheets)
        {
            var filter = new DataFilter();
            filter.A1Range = sheet.DisplayName();
            body.DataFilters.Add(filter);    
        }

        IList<MatchedValueRange> matchedValues;
        try
        {
            var googleRequest = _googleSheetValues.BatchGetByDataFilter(body, _spreadsheetId);
            var googleResponse = googleRequest.Execute();
            matchedValues = googleResponse.ValueRanges;
        }
        catch (System.Exception)
        {
            _sheet.Errors.Add($"Failed to load sheet data");
            return;
        }
        
        foreach (var matchedValue in matchedValues)
        {
            var sheetRange = matchedValue.DataFilters[0].A1Range;

            var values = matchedValue.ValueRange.Values;

            MapData(sheetRange, values);
        }
        //Console.Write(JsonSerializer.Serialize(matchedValues));
    }

    private IList<IList<object>> GetSheetData(string sheetRange) {
        IList<IList<object>> values;

        try
        {
            var googleRequest = _googleSheetValues.Get(_spreadsheetId, sheetRange);
            var googleResponse = googleRequest.Execute();
            values = googleResponse.Values;
        }
        catch (System.Exception)
        {
            _sheet.Errors.Add($"Failed to load {sheetRange}");
            return null;
        }

        return values;
    }

    private void NewSheet() {
        // var service = new SheetsService(new BaseClientService.Initializer()
        //     {
        //         HttpClientInitializer = credential,
        //         ApplicationName = ApplicationName,
        //     });

        var sheet = new AddSheetRequest();
        sheet.Properties = new SheetProperties();

        sheet.Properties.Title = "Test";
        BatchUpdateSpreadsheetRequest batchUpdateSpreadsheetRequest = new BatchUpdateSpreadsheetRequest();
        batchUpdateSpreadsheetRequest.Requests = new List<Request>();
        batchUpdateSpreadsheetRequest.Requests.Add(new Request { AddSheet = sheet });

        var batchUpdateRequest = _googleSheetService.Spreadsheets.BatchUpdate(batchUpdateSpreadsheetRequest, _spreadsheetId);
        // batchUpdateRequest.Execute();
    }

    private void LoadData(string sheetRange)
        {
            IList<IList<object>> values;

            values = GetSheetData(sheetRange);

            if (values == null) {
                return;
            }

            MapData(sheetRange, values);
        }

        private void MapData(string sheetRange, IList<IList<object>> values) {
            SheetEnum sheetEnum;

            Enum.TryParse<SheetEnum>(sheetRange, out sheetEnum);
            
            switch (sheetEnum)
            {
                case SheetEnum.Addresses:
                    _sheet.Addresses = AddressMapper.MapFromRangeData(values);
                    break;

                case SheetEnum.Names:
                    _sheet.Names = NameMapper.MapFromRangeData(values);
                break;

                case SheetEnum.Places:
                    _sheet.Places = PlaceMapper.MapFromRangeData(values);
                break;

                case SheetEnum.Regions:
                    _sheet.Regions = RegionMapper.MapFromRangeData(values);
                break;

                case SheetEnum.Services:
                    _sheet.Services = ServiceMapper.MapFromRangeData(values);
                break;

                case SheetEnum.Shifts:
                    _sheet.Shifts = ShiftMapper.MapFromRangeData(values);
                break;

                case SheetEnum.Trips:
                    _sheet.Trips = TripMapper.MapFromRangeData(values);
                break;

                case SheetEnum.Types:
                    _sheet.Types = TypeMapper.MapFromRangeData(values);
                break;

                case SheetEnum.Weekdays:
                    _sheet.Weekdays = WeekdayMapper.MapFromRangeData(values);
                break;
            }
        }

        private void WarmupLambda()
        {
            Console.WriteLine("Warming up Lambda");
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
