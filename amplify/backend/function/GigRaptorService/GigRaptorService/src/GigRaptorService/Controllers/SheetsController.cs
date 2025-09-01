using GigRaptorService.Attributes;
using GigRaptorService.Business;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;
using System.Diagnostics;

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
            // Track rate limit hit (fire and forget to not block)
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
        var stopwatch = Stopwatch.StartNew();
        var success = false;

        try
        {
            InitializeSheetmanager(sheetEntity.Properties.Id);
            var result = await _sheetmanager!.SaveData(sheetEntity);
            
            // Determine success based on whether we got a result and no critical errors
            success = result != null && (result.SheetEntity?.Messages?.Any(m => m.Level.ToLower() == "error") != true);

            // Track sync metrics 
            try
            {
                var sheetId = sheetEntity.Properties.Id ?? "";
                await _metricsService.TrackSheetsOperationAsync("SaveData", stopwatch.Elapsed, success);
                await _metricsService.TrackUserActivityAsync(sheetId, "DataSync");
                
                // Track data volume - be defensive about property access
                var totalItems = (sheetEntity.Trips?.Count ?? 0) + 
                               (sheetEntity.Shifts?.Count ?? 0);
                
                // Add other collections if they exist
                try
                {
                    // Use reflection to safely check for other collections
                    var entityType = sheetEntity.GetType();
                    var expensesProperty = entityType.GetProperty("Expenses");
                    if (expensesProperty != null)
                    {
                        var expenses = expensesProperty.GetValue(sheetEntity) as System.Collections.ICollection;
                        totalItems += expenses?.Count ?? 0;
                    }
                }
                catch
                {
                    // Ignore reflection errors
                }
                
                await _metricsService.TrackCustomMetricAsync("Sheets.SaveData.ItemCount", totalItems);
                _logger.LogInformation("📊 Sheets metrics sent successfully");
            }
            catch (Exception ex)
            {
                // Log but don't throw - metrics failures shouldn't impact the main operation
                _logger.LogError(ex, "Failed to track save metrics");
            }

            return result;
        }
        catch (Exception)
        {
            success = false;
            throw;
        }
        finally
        {
            stopwatch.Stop();
        }
    }
}
