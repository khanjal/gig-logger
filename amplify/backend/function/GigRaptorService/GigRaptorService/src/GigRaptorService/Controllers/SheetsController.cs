using GigRaptorService.Attributes;
using GigRaptorService.Business;
using GigRaptorService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class SheetsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private SheetManager? _sheetmanager;

    public SheetsController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private void InitializeSheetmanager(string? sheetId = null)
    {
        RateLimiter.MaybeCleanupExpiredEntries();

        // If sheetId is not provided, get it from the header  
        sheetId ??= HttpContext.Request.Headers["Sheet-Id"].ToString();
        if (string.IsNullOrEmpty(sheetId))
            throw new Exception("SheetId must be provided.");

        if (!RateLimiter.IsRequestAllowed(sheetId))
            throw new InvalidOperationException($"Rate limit exceeded for SpreadsheetId: {sheetId}. Please try again later.");

        var accessToken = GetAccessTokenFromHeader();
        // Middleware guarantees accessToken is valid  
        _sheetmanager = new SheetManager(accessToken!, sheetId, _configuration);
    }

    private string? GetAccessTokenFromHeader()
    {
        var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            return null;
        return authHeader.Substring("Bearer ".Length).Trim();
    }

    // GET api/sheets/all  
    [HttpGet("all")]
    [RequireSheetId]
    public async Task<SheetResponse> GetAll()
    {
        InitializeSheetmanager();
        return await _sheetmanager!.GetSheets();
    }

    // GET api/sheets/get/single  
    [HttpGet("single/{sheetName}")]
    [RequireSheetId]
    public async Task<SheetResponse> GetSingle(string sheetName)
    {
        InitializeSheetmanager();
        return await _sheetmanager!.GetSheet(sheetName);
    }

    [HttpGet("multiple")]
    [RequireSheetId]
    public async Task<SheetResponse> GetMultiple([FromQuery] string[] sheetName)
    {
        InitializeSheetmanager();
        return await _sheetmanager!.GetSheets(sheetName);
    }

    // GET api/sheets/health  
    [HttpGet("health")]
    [RequireSheetId]
    public async Task<bool> Health()
    {
        InitializeSheetmanager();
        await Task.CompletedTask;
        return true;
    }

    // POST api/sheets/create  
    [HttpPost("create")]
    [RequireSheetId]
    public async Task<SheetResponse> Create([FromBody] PropertyEntity properties)
    {
        InitializeSheetmanager();
        return await _sheetmanager!.CreateSheet();
    }

    // POST api/sheets/save  
    [HttpPost("save")]
    [RequireSheetId]
    public async Task<SheetResponse> Save([FromBody] SheetEntity sheetEntity)
    {
        InitializeSheetmanager(sheetEntity.Properties.Id);
        return await _sheetmanager!.SaveData(sheetEntity);
    }
}
