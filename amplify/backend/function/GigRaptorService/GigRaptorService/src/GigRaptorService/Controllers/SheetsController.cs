using GigRaptorService.Attributes;
using GigRaptorService.Business;
using GigRaptorService.Helpers;
using Microsoft.AspNetCore.Mvc;
using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class SheetsController : ControllerBase
{
    private SheetManager? _sheetmanager;

    private void InitializeSheetmanger()
    {
        if (HttpContext.Items.TryGetValue("Sheet-Id", out var sheetId))
        {
            _sheetmanager = new SheetManager(ConfigurationHelper.GetJsonCredential(), sheetId?.ToString()!);
        }
        else
        {
            throw new Exception("SheetId must be provided.");
        }
    }

    private void InitializeSheetmanger(string sheetId)
    {
        _sheetmanager = new SheetManager(ConfigurationHelper.GetJsonCredential(), sheetId);
    }

    // GET api/sheets/all
    [HttpGet("all")]
    [RequireSheetId]
    public async Task<SheetEntity?> GetAll()
    {
        InitializeSheetmanger();
        return await _sheetmanager!.GetSheets();
    }

    // GET api/sheets/get/single
    [HttpGet("single/{sheetName}")]
    [RequireSheetId]
    public async Task<SheetEntity?> GetSingle(string sheetName)
    {
        InitializeSheetmanger();
        return await _sheetmanager!.GetSheet(sheetName);
    }

    [HttpGet("multiple")]
    [RequireSheetId]
    public async Task<SheetEntity?> GetMultiple([FromQuery] string[] sheetName)
    {
        InitializeSheetmanger();
        return await _sheetmanager!.GetSheets(sheetName);
    }

    // GET api/sheets/check
    [HttpGet("check")]
    [RequireSheetId]
    public async Task<List<MessageEntity>> Check()
    {
        InitializeSheetmanger();
        return await _sheetmanager!.CheckSheets();
    }

    // GET api/sheets/health
    [HttpGet("health")]
    [RequireSheetId]
    public async Task<bool> Health()
    {
        InitializeSheetmanger();
        return !string.IsNullOrEmpty(await _sheetmanager!.GetName());
    }

    // POST api/sheets/create
    [HttpPost("create")]
    [RequireSheetId]
    public async Task<SheetEntity> Create([FromBody] PropertyEntity properties)
    {
        InitializeSheetmanger();
        return await _sheetmanager!.CreateSheet();
    }

    // POST api/sheets/save
    [HttpPost("save")]
    [RequireSheetId]
    public async Task<SheetEntity> Save([FromBody] SheetEntity sheetEntity)
    {
        InitializeSheetmanger(sheetEntity.Properties.Id);
        return await _sheetmanager!.SaveData(sheetEntity);
    }
}
