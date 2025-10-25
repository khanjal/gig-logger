using GigRaptorService.Helpers;
using GigRaptorService.Models;
using GigRaptorService.Services;
using RaptorSheets.Core.Extensions;
using RaptorSheets.Gig.Entities;
using RaptorSheets.Gig.Enums;
using RaptorSheets.Gig.Managers;
using RaptorSheets.Core.Entities;
using System.Text.Json;

namespace GigRaptorService.Business;

public interface ISheetManager
{
    public Task<SheetResponse> CreateSheet();
    public Task<SheetResponse> Demo();
    public Task<SheetResponse> GetSheet(string sheet);
    public Task<SheetResponse> GetSheets(string[] sheets);
    public Task<SheetResponse> GetSheets();
    public Task<SheetResponse> SaveData(SheetEntity sheetEntity);
}

public class SheetManager : ISheetManager
{
    private readonly IGoogleSheetManager _googleSheetManager;
    private readonly IConfiguration _configuration;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly IS3Service _s3Service;
    private readonly string _sheetId;

    // Use Lazy<T> to only create the rate limiter when it's needed
    private static readonly Lazy<DynamoDbRateLimiter> _lazyRateLimiter = new Lazy<DynamoDbRateLimiter>(() => 
        new DynamoDbRateLimiter(
            new Amazon.DynamoDBv2.AmazonDynamoDBClient(),
            "RaptorSheetsRateLimit",
            5,
            TimeSpan.FromMinutes(1)
        ),
        LazyThreadSafetyMode.ExecutionAndPublication
    );

    public SheetManager(string token, string sheetId, IConfiguration configuration, IS3Service? s3Service = null)
    {
        _configuration = configuration;
        if (FeatureFlags.IsRateLimitingEnabled(_configuration))
        {
            // Apply rate limiting as needed
            EnforceRateLimitAsync(sheetId).GetAwaiter().GetResult();
        }
        _googleSheetManager = new GoogleSheetManager(token, sheetId);
        _s3Service = s3Service ?? new S3Service(configuration);
        _sheetId = sheetId;

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public static async Task<SheetManager> CreateAsync(string token, string sheetId, IConfiguration configuration)
    {
        if (FeatureFlags.IsRateLimitingEnabled(configuration))
        {
            await EnforceRateLimitAsync(sheetId);
        }
        return new SheetManager(token, sheetId, configuration);
    }

    private static async Task EnforceRateLimitAsync(string spreadsheetId)
    {
        // Use the lazy-initialized rate limiter
        var hashedSpreadsheetId = HashHelper.HashSpreadsheetId(spreadsheetId);
        if (!await _lazyRateLimiter.Value.IsRequestAllowedAsync(hashedSpreadsheetId))
        {
            throw new InvalidOperationException($"Rate limit exceeded for spreadsheet ID: {hashedSpreadsheetId}. Please try again later.");
        }
    }

    /// <summary>
    /// Helper method to handle response size check and S3 upload if needed
    /// </summary>
    /// <param name="sheetEntity">The sheet entity to process</param>
    /// <param name="requestType">The type of request for S3 key generation</param>
    /// <param name="metadata">Optional metadata to include in the response</param>
    /// <returns>SheetResponse with either direct data or S3 link</returns>
    private async Task<SheetResponse> ProcessResponseSize(SheetEntity sheetEntity, string requestType, Dictionary<string, string>? metadata = null)
    {
        string jsonContent = JsonSerializer.Serialize(sheetEntity, _jsonOptions);

        // Check if the response is too large using the optimized method
        if (_s3Service.ExceedsSizeThreshold(jsonContent))
        {
            // Upload to S3 and return the link
            string s3Link = await _s3Service.UploadSheetEntityToS3Async(jsonContent, _sheetId, requestType);
            
            // Ensure metadata includes sheetId
            metadata ??= new Dictionary<string, string>();
            if (!metadata.ContainsKey("sheetId"))
            {
                metadata["sheetId"] = _sheetId;
            }
            
            return SheetResponse.FromS3Link(s3Link, metadata);
        }
        
        return SheetResponse.FromSheetEntity(sheetEntity);
    }

    public async Task<SheetResponse> CreateSheet()
    {
        var sheetEntity = await _googleSheetManager.CreateAllSheets();
        return SheetResponse.FromSheetEntity(sheetEntity);
    }

    public async Task<SheetResponse> GetSheet(string sheet)
    {
        var sheetEntity = await _googleSheetManager.GetSheet(sheet);
        
        return await ProcessResponseSize(
            sheetEntity, 
            $"single-{sheet}", 
            new Dictionary<string, string> { { "sheetName", sheet } }
        );
    }

    public async Task<SheetResponse> GetSheets(string[] sheets)
    {
        var sheetList = new List<string>();
        var gigSheets = RaptorSheets.Gig.Helpers.GigSheetHelpers.GetSheetNames();
        foreach (var sheet in sheets)
        {
            var foundSheet = gigSheets.Any(gigSheet => string.Equals(gigSheet, sheet, StringComparison.OrdinalIgnoreCase));

            if (foundSheet)
            {
                sheetList.Add(sheet);
            }
        }
        
        var sheetEntity = await _googleSheetManager.GetSheets(sheetList);
        
        return await ProcessResponseSize(
            sheetEntity, 
            "multiple", 
            new Dictionary<string, string> { { "sheetCount", sheets.Length.ToString() } }
        );
    }

    public async Task<SheetResponse> GetSheets()
    {
        var sheetData = await _googleSheetManager.GetAllSheets();
        var sheetEntity = sheetData ?? new SheetEntity();
        
        return await ProcessResponseSize(
            sheetEntity, 
            "all", 
            new Dictionary<string, string> { { "type", "all" } }
        );
    }

    public async Task<SheetResponse> SaveData(SheetEntity sheetEntity)
    {
        var returnEntity = new SheetEntity { Messages = new List<MessageEntity>() };
        returnEntity.Messages.AddRange((await _googleSheetManager.ChangeSheetData([SheetEnum.TRIPS.GetDescription(), SheetEnum.SHIFTS.GetDescription(), RaptorSheets.Common.Enums.SheetEnum.SETUP.GetDescription()], sheetEntity)).Messages);
        
        // Save operations typically have small responses, so we don't need to check size
        return SheetResponse.FromSheetEntity(returnEntity);
    }

    public async Task<SheetResponse> Demo()
    {
        var sheetData = _googleSheetManager.GenerateDemoData();

        var returnEntity = await SaveData(sheetData);

        return returnEntity;
    }
}