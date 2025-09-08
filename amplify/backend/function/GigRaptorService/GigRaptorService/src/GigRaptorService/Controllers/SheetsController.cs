using GigRaptorService.Attributes;
using GigRaptorService.Business;
using GigRaptorService.Helpers;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.AspNetCore.Mvc;
using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class SheetsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IMetricsService _metricsService;
    private readonly ILogger<SheetsController> _logger;
    private SheetManager? _sheetmanager;

    public SheetsController(IConfiguration configuration, IMetricsService metricsService, ILogger<SheetsController> logger)
    {
        _configuration = configuration;
        _metricsService = metricsService;
        _logger = logger;
    }

    private void InitializeSheetmanager(string? sheetId = null)
    {
        RateLimiter.MaybeCleanupExpiredEntries();

        // If sheetId is not provided, get it from the header  
        sheetId ??= HttpContext.Request.Headers["Sheet-Id"].ToString();
        if (string.IsNullOrEmpty(sheetId))
            throw new Exception("SheetId must be provided.");

        if (!RateLimiter.IsRequestAllowed(sheetId))
        {
            // Track rate limit hit (must use Task.Run since this method is not async)
            TrackRateLimitMetricsAsync(sheetId);
            
            throw new InvalidOperationException($"Rate limit exceeded for SpreadsheetId: {sheetId}. Please try again later.");
        }

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

    private string GetSheetId() => HttpContext.Request.Headers["Sheet-Id"].ToString();

    // GET api/sheets/all  
    [HttpGet("all")]
    [RequireSheetId]
    [TrackMetrics("sheets-all")]
    public async Task<SheetResponse> GetAll()
    {
        InitializeSheetmanager();
        return await _sheetmanager!.GetSheets();
    }

    // GET api/sheets/get/single  
    [HttpGet("single/{sheetName}")]
    [RequireSheetId]
    [TrackMetrics("sheets-single")]
    public async Task<SheetResponse> GetSingle(string sheetName)
    {
        InitializeSheetmanager();
        return await _sheetmanager!.GetSheet(sheetName);
    }

    [HttpGet("multiple")]
    [RequireSheetId]
    [TrackMetrics("sheets-multiple")]
    public async Task<SheetResponse> GetMultiple([FromQuery] string[] sheetName)
    {
        InitializeSheetmanager();
        return await _sheetmanager!.GetSheets(sheetName);
    }

    // GET api/sheets/health  
    [HttpGet("health")]
    [RequireSheetId]
    [TrackMetrics("sheets-health")]
    public async Task<bool> Health()
    {
        InitializeSheetmanager();
        await Task.CompletedTask;
        return true;
    }

    // POST api/sheets/create  
    [HttpPost("create")]
    [RequireSheetId]
    [TrackMetrics("sheets-create")]
    public async Task<SheetResponse> Create([FromBody] PropertyEntity properties)
    {
        InitializeSheetmanager();
        return await _sheetmanager!.CreateSheet();
    }

    // POST api/sheets/save  
    [HttpPost("save")]
    [RequireSheetId]
    [TrackMetrics("sheets-save")]
    public async Task<SheetResponse> Save([FromBody] SheetEntity sheetEntity)
    {
        InitializeSheetmanager(sheetEntity.Properties.Id);
        return await _sheetmanager!.SaveData(sheetEntity);
    }

    private void TrackRateLimitMetricsAsync(string sheetId)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await _metricsService.TrackRateLimitHitAsync(sheetId);
                _logger.LogWarning("📊 Rate limit metrics sent for sheet {SheetId}", sheetId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to track rate limit metrics");
            }
        });
    }
}
