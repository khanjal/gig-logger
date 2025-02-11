using RLE.Core.Entities;
using RLE.Gig.Entities;
using RLE.Gig.Enums;
using RLE.Gig.Utilities.Google;

namespace  GigRaptorService.Business;

public interface ISheetManager
{
    public Task<SheetEntity> AddData(SheetEntity sheetEntity);
    public Task<List<MessageEntity>> CheckSheets();
    public Task<SheetEntity> CreateSheet();
    public Task<string?> GetName();
    public Task<SheetEntity> GetSheet(string sheet);
    public Task<SheetEntity> GetSheets(string[] sheets);
    public Task<SheetEntity> GetSheets();
}
public class SheetManager : ISheetManager
{
    private IGoogleSheetManager _googleSheetManger;
    public SheetManager(string token, string sheetId) {
        _googleSheetManger = new GoogleSheetManager(token, sheetId);
    }

    public SheetManager(Dictionary<string,string> credentials, string sheetId)
    {
        _googleSheetManger = new GoogleSheetManager(credentials, sheetId);
    }

    public async Task<SheetEntity> AddData(SheetEntity sheetEntity)
    {
        return await _googleSheetManger.AddSheetData([SheetEnum.TRIPS, SheetEnum.SHIFTS], sheetEntity);
    }

    public async Task<List<MessageEntity>> CheckSheets()
    {
        return await _googleSheetManger.CheckSheets(true);
    }

    public async Task<SheetEntity> CreateSheet()
    {
        return await _googleSheetManger.CreateSheets();
    }

    public async Task<string?> GetName()
    {
        return await _googleSheetManger.GetSpreadsheetName();
    }

    public async Task<SheetEntity> GetSheet(string sheet)
    {
        return await _googleSheetManger.GetSheet(sheet);
    }

    public async Task<SheetEntity> GetSheets(string[] sheets)
    {
        var sheetEnums = new List<SheetEnum>();
        foreach (var sheet in sheets)
        {
            var foundEnum = Enum.TryParse(sheet, true, out SheetEnum sheetName);

            if (foundEnum)
            {
                sheetEnums.Add(sheetName);
            }
        }
        return await _googleSheetManger.GetSheets(sheetEnums);
    }

    public async Task<SheetEntity> GetSheets()
    {
        var sheetData = await _googleSheetManger.GetSheets();

        return sheetData ?? new SheetEntity();
    }
}
