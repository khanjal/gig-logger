using GigRaptorService.Business;
using GigRaptorService.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;

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

    // GET api/sheets/all
    [HttpGet("all")]
    public async Task<SheetEntity?> GetAll()
    {
        InitializeSheetmanger();
        return await _sheetmanager.GetSheets();
    }

    // GET api/sheets/get/single
    [HttpGet("single/{sheetName}")]
    public async Task<SheetEntity?> GetSingle(string sheetName)
    {
        InitializeSheetmanger();
        return await _sheetmanager.GetSheet(sheetName);
    }

    [HttpGet("multiple")]
    public async Task<SheetEntity?> GetMultiple([FromQuery] string[] sheetName)
    {
        InitializeSheetmanger();
        return await _sheetmanager.GetSheets(sheetName);
    }

    // GET api/sheets/check
    [HttpGet("check")]
    public async Task<List<MessageEntity>> Check()
    {
        InitializeSheetmanger();
        return await _sheetmanager.CheckSheets();
    }

    // GET api/sheets/health
    [HttpGet("health")]
    public async Task<bool> health()
    {
        InitializeSheetmanger();
        return !string.IsNullOrEmpty(await _sheetmanager.GetName());
    }

    // POST api/sheets/create
    [HttpPost("create")]
    public async Task<SheetEntity> Create([FromBody] PropertyEntity properties)
    {
        InitializeSheetmanger();
        return await _sheetmanager.CreateSheet();
    }

    // POST api/sheets/save
    [HttpPost("save")]
    public async Task<SheetEntity> Save([FromBody] SheetEntity sheetEntity)
    {
        InitializeSheetmanger(sheetEntity.Properties.Id);
        return await _sheetmanager.SaveData(sheetEntity);
    }
}