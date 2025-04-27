using RaptorSheets.Core.Extensions;
using RaptorSheets.Gig.Entities;
using RaptorSheets.Gig.Enums;
using RaptorSheets.Gig.Managers;

namespace  GigRaptorService.Business;

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
    private IGoogleSheetManager _googleSheetManager;
    public SheetManager(string token, string sheetId) {
        _googleSheetManager = new GoogleSheetManager(token, sheetId);
    }

    public SheetManager(Dictionary<string,string> credentials, string sheetId)
    {
        _googleSheetManager = new GoogleSheetManager(credentials, sheetId);
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
