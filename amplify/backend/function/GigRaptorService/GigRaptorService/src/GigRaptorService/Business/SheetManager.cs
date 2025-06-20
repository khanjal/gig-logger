using GigRaptorService.Helpers;
using RaptorSheets.Core.Extensions;
using RaptorSheets.Gig.Entities;
using RaptorSheets.Gig.Enums;
using RaptorSheets.Gig.Managers;

namespace GigRaptorService.Business;

public interface ISheetManager
{
    public Task<SheetEntity> CreateSheet();
    public Task<SheetEntity> GetSheet(string sheet);
    public Task<SheetEntity> GetSheets(string[] sheets);
    public Task<SheetEntity> GetSheets();
    public Task<SheetEntity> SaveData(SheetEntity sheetEntity);
}
public class SheetManager : ISheetManager
{
    private readonly IGoogleSheetManager _googleSheetManager;
    // Removed _configuration field as it's not used in instance methods

    public SheetManager(string token, string sheetId, IConfiguration configuration)
    {
        // Removed storing configuration as it's not used in instance methods
        _googleSheetManager = new GoogleSheetManager(token, sheetId);
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
        // Lazily create the rate limiter only if needed
        var rateLimiter = new DynamoDbRateLimiter(
            new Amazon.DynamoDBv2.AmazonDynamoDBClient(),
            "RaptorSheetsRateLimit",
            5,
            TimeSpan.FromMinutes(1)
        );
        var hashedSpreadsheetId = HashHelper.HashSpreadsheetId(spreadsheetId);
        if (!await rateLimiter.IsRequestAllowedAsync(hashedSpreadsheetId))
        {
            throw new InvalidOperationException($"Rate limit exceeded for spreadsheet ID: {hashedSpreadsheetId}. Please try again later.");
        }
    }

    public async Task<SheetEntity> CreateSheet()
    {
        return await _googleSheetManager.CreateSheets();
    }

    public async Task<SheetEntity> GetSheet(string sheet)
    {
        return await _googleSheetManager.GetSheet(sheet);
    }

    public async Task<SheetEntity> GetSheets(string[] sheets)
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
        return await _googleSheetManager.GetSheets(sheetList);
    }

    public async Task<SheetEntity> GetSheets()
    {
        var sheetData = await _googleSheetManager.GetSheets();

        return sheetData ?? new SheetEntity();
    }

    public async Task<SheetEntity> SaveData(SheetEntity sheetEntity)
    {
        var returnEntity = new SheetEntity { Messages = [] };
        returnEntity.Messages.AddRange((await _googleSheetManager.ChangeSheetData([SheetEnum.TRIPS.GetDescription(), SheetEnum.SHIFTS.GetDescription(), RaptorSheets.Common.Enums.SheetEnum.SETUP.GetDescription()], sheetEntity)).Messages);
        return returnEntity;
    }
}