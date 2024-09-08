using GigRaptorLib.Entities;
using GigRaptorService.Business;
using GigRaptorService.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class SheetsController : ControllerBase
{
    private ISheetManager _sheetmanager;

    private void InitializeSheetmanger()
    {
        // TODO: Make this a middleware check too.
        if (!Request.Headers.TryGetValue("Sheet-Id", out StringValues headerValues))
        {
            throw new Exception("SheetId must be provided.");
        }

        _sheetmanager = new SheetManager(ConfigurationHelper.GetJsonCredential(), headerValues!.ToString().Trim());
    }

    private void InitializeSheetmanger(string sheetId)
    {
        _sheetmanager = new SheetManager(ConfigurationHelper.GetJsonCredential(), sheetId);
    }

    // GET api/sheets/get
    [HttpGet("get/{sheetId}")]
    public async Task<SheetEntity?> Get(string sheetId)
    {
        InitializeSheetmanger(sheetId);
        return await _sheetmanager.GetSheets();
    }

    // GET api/sheets/get/shifts
    [HttpGet("get/{sheetId}/{sheetName}")]
    public async Task<SheetEntity?> Get(string sheetId, string sheetName)
    {
        InitializeSheetmanger(sheetId);
        return await _sheetmanager.GetSheet(sheetName);
    }

    // GET api/sheets/check
    [HttpGet("check/{sheetId}")]
    public async Task<List<MessageEntity>> Check(string sheetId)
    {
        InitializeSheetmanger(sheetId);
        return await _sheetmanager.CheckSheets();
    }

    // GET api/sheets/health
    [HttpGet("health/{sheetId}")]
    public async Task<bool> health(string sheetId)
    {
        InitializeSheetmanger(sheetId);
        return !string.IsNullOrEmpty(await _sheetmanager.GetName());
    }

    // POST api/sheets/create
    [HttpPost("create")]
    public async Task<SheetEntity> Create([FromBody] PropertyEntity properties)
    {
        InitializeSheetmanger(properties.Id);
        return await _sheetmanager.CreateSheet();
    }

    // POST api/sheets/add
    [HttpPost("add")]
    public async Task<SheetEntity> Add([FromBody] SheetEntity sheetEntity)
    {
        InitializeSheetmanger(sheetEntity.Properties.Id);
        return await _sheetmanager.AddData(sheetEntity);
    }
}