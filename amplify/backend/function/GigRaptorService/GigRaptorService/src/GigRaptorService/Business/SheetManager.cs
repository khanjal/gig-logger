using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;
using RaptorSheets.Gig.Enums;
using RaptorSheets.Gig.Managers;

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
    public Task<SheetEntity> SaveData(SheetEntity sheetEntity);
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
        return await _googleSheetManger.ChangeSheetData([SheetEnum.TRIPS, SheetEnum.SHIFTS], sheetEntity, RaptorSheets.Core.Enums.ActionTypeEnum.APPEND);
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

    public async Task<SheetEntity> SaveData(SheetEntity sheetEntity)
    {
        var returnEntity = new SheetEntity { Messages = [] };

        var addData = new SheetEntity
        {
            Shifts = sheetEntity.Shifts.Where(x => x.Action == "ADD").ToList(),
            Trips = sheetEntity.Trips.Where(x => x.Action == "ADD").ToList()
        };

        if (addData.Shifts.Count > 0 || addData.Trips.Count > 0)
            returnEntity.Messages.AddRange((await _googleSheetManger.ChangeSheetData([SheetEnum.TRIPS, SheetEnum.SHIFTS], addData, RaptorSheets.Core.Enums.ActionTypeEnum.APPEND)).Messages);

        var editData = new SheetEntity
        {
            Shifts = sheetEntity.Shifts.Where(x => x.Action == "UPDATE").ToList(),
            Trips = sheetEntity.Trips.Where(x => x.Action == "UPDATE").ToList()
        };

        if (editData.Shifts.Count > 0 || editData.Trips.Count > 0)
            returnEntity.Messages.AddRange((await _googleSheetManger.ChangeSheetData([SheetEnum.TRIPS, SheetEnum.SHIFTS], editData, RaptorSheets.Core.Enums.ActionTypeEnum.UPDATE)).Messages);

        var deleteData = new SheetEntity
        {
            Shifts = sheetEntity.Shifts.Where(x => x.Action == "DELETE").ToList(),
            Trips = sheetEntity.Trips.Where(x => x.Action == "DELETE").ToList()
        };

        if (deleteData.Shifts.Count > 0 || deleteData.Trips.Count > 0)
            returnEntity.Messages.AddRange((await _googleSheetManger.ChangeSheetData([SheetEnum.TRIPS, SheetEnum.SHIFTS], deleteData, RaptorSheets.Core.Enums.ActionTypeEnum.DELETE)).Messages);

        return returnEntity;
    }
}
