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
        // Perform cleanup
        RateLimiter.MaybeCleanupExpiredEntries();

        var sheetId = HttpContext.Request.Headers["Sheet-Id"].ToString() ?? throw new Exception("SheetId must be provided.");

        if (!RateLimiter.IsRequestAllowed(sheetId))
        {
            throw new InvalidOperationException($"Rate limit exceeded for SpreadsheetId: {sheetId}. Please try again later.");
        }

        _sheetmanager = new SheetManager(ConfigurationHelper.GetJsonCredential(), sheetId?.ToString()!);
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

    // GET api/sheets/health
    [HttpGet("health")]
    [RequireSheetId]
    public async Task<bool> Health()
    {
        InitializeSheetmanger();
        await Task.CompletedTask;
        return true;
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
