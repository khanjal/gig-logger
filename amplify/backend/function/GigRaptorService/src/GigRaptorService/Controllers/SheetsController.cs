using GigRaptorService.Attributes;
using GigRaptorService.Business;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.AspNetCore.Mvc;
using RaptorSheets.Gig.Entities;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class SheetsController : ControllerBase
{
    private const int MaxTripsPerSave = 10000;
    private const int MaxSheetNamesPerRequest = 50;

    private readonly IConfiguration _configuration;
    private readonly IMetricsService _metricsService;
    private readonly ILogger<SheetsController> _logger;
    private SheetManager? _sheetmanager;
    private SheetHeaders? _headers;

    public SheetsController(IConfiguration configuration, IMetricsService metricsService, ILogger<SheetsController> logger)
    {
        _configuration = configuration;
        _metricsService = metricsService;
        _logger = logger;
    }

    private void InitializeSheetmanager(SheetHeaders headers, string? sheetId = null)
    {
        _headers = headers;
        RateLimiter.MaybeCleanupExpiredEntries();

        // If sheetId is not provided, get it from the header
        sheetId ??= headers.SheetId;
        if (string.IsNullOrEmpty(sheetId))
            throw new Exception("SheetId must be provided.");

        if (!RateLimiter.IsRequestAllowed(sheetId))
        {
            // Track rate limit hit (must use Task.Run since this method is not async)
            TrackRateLimitMetricsAsync(sheetId, GetCorrelationId());
            throw new InvalidOperationException($"Rate limit exceeded for SpreadsheetId: {sheetId}. Please try again later.");
        }

        var accessToken = GetAccessTokenFromHeader(headers);
        // Middleware guarantees accessToken is valid
        _sheetmanager = new SheetManager(accessToken!, sheetId, _configuration, logger: _logger);
    }

    // HttpContext is null when a test constructs the controller directly rather than
    // through the MVC pipeline, so fall back to a fresh id instead of throwing.
    private string GetCorrelationId() => HttpContext?.TraceIdentifier ?? Guid.NewGuid().ToString("N");

    /// <summary>
    /// Wraps a controller action with structured start/success/failure logging tagged
    /// with a per-request correlation id, so operations can be traced across log lines.
    /// </summary>
    private async Task<T> LogActionAsync<T>(string actionName, string? sheetId, Func<Task<T>> action)
    {
        var correlationId = GetCorrelationId();
        _logger.LogInformation("[{CorrelationId}] {Action} started for sheet {SheetId}", correlationId, actionName, sheetId);

        try
        {
            var result = await action();
            _logger.LogInformation("[{CorrelationId}] {Action} completed for sheet {SheetId}", correlationId, actionName, sheetId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{CorrelationId}] {Action} failed for sheet {SheetId}", correlationId, actionName, sheetId);
            throw;
        }
    }

    private string? GetAccessTokenFromHeader(SheetHeaders headers)
    {
        var authHeader = headers.Authorization;
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            return null;
        return authHeader.Substring("Bearer ".Length).Trim();
    }

    // GET api/sheets/all
    [HttpGet("all")]
    [RequireSheetId]
    [TrackMetrics("sheets-all")]
    public Task<SheetResponse> GetAll([FromHeader] SheetHeaders headers) =>
        LogActionAsync(nameof(GetAll), headers.SheetId, async () =>
        {
            InitializeSheetmanager(headers);
            return await _sheetmanager!.GetSheets();
        });

    // GET api/sheets/{sheetName}  
    [HttpGet("{sheetName}")]
    [RequireSheetId]
    [TrackMetrics("sheets-single")]
    public Task<SheetResponse> GetSingle(string sheetName, [FromHeader] SheetHeaders headers) =>
        LogActionAsync(nameof(GetSingle), headers.SheetId, async () =>
        {
            InitializeSheetmanager(headers);
            return await _sheetmanager!.GetSheet(sheetName);
        });

    // GET api/sheets?names=sheet1,sheet2
    [HttpGet("")]
    [RequireSheetId]
    [TrackMetrics("sheets-multiple")]
    public Task<SheetResponse> GetMultiple([FromQuery(Name = "names")] string[] sheetNames, [FromHeader] SheetHeaders headers) =>
        LogActionAsync(nameof(GetMultiple), headers.SheetId, async () =>
        {
            if (sheetNames == null || sheetNames.Length == 0)
                throw new ArgumentException("At least one sheet name must be provided.");
            if (sheetNames.Length > MaxSheetNamesPerRequest)
                throw new ArgumentException($"Too many sheet names requested (max {MaxSheetNamesPerRequest}).");

            InitializeSheetmanager(headers);
            return await _sheetmanager!.GetSheets(sheetNames);
        });

    // GET api/sheets/health  
    [HttpGet("health")]
    [RequireSheetId]
    [TrackMetrics("sheets-health")]
    public Task<bool> Health([FromHeader] SheetHeaders headers) =>
        LogActionAsync(nameof(Health), headers.SheetId, async () =>
        {
            InitializeSheetmanager(headers);
            await Task.CompletedTask;
            return true;
        });

    // POST api/sheets  
    [HttpPost("")]
    [RequireSheetId]
    [TrackMetrics("sheets-create")]
    public Task<SheetResponse> Create([FromHeader] SheetHeaders headers) =>
        LogActionAsync(nameof(Create), headers.SheetId, async () =>
        {
            InitializeSheetmanager(headers);
            return await _sheetmanager!.CreateSheet();
        });

    // PUT api/sheets  
    [HttpPut("")]
    [RequireSheetId]
    [TrackMetrics("sheets-save")]
    public Task<SheetResponse> Save([FromBody] SheetEntity sheetEntity, [FromHeader] SheetHeaders headers) =>
        LogActionAsync(nameof(Save), sheetEntity?.Properties?.Id ?? headers.SheetId, async () =>
        {
            ValidateSaveRequest(sheetEntity);
            InitializeSheetmanager(headers, sheetEntity!.Properties!.Id);
            return await _sheetmanager!.SaveData(sheetEntity);
        });

    private static void ValidateSaveRequest(SheetEntity? sheetEntity)
    {
        if (sheetEntity == null)
            throw new ArgumentException("Request body is required for Save.");
        if (sheetEntity.Properties == null)
            throw new ArgumentException("SheetEntity.Properties is required for Save.");
        if (sheetEntity.Trips != null && sheetEntity.Trips.Count > MaxTripsPerSave)
            throw new ArgumentException($"Too many trips in a single request (max {MaxTripsPerSave}).");
    }

    [HttpPost("demo")]
    [RequireSheetId]
    [TrackMetrics("sheets-demo")]
    public Task<SheetResponse> Demo([FromHeader] SheetHeaders headers) =>
        LogActionAsync(nameof(Demo), headers.SheetId, async () =>
        {
            InitializeSheetmanager(headers);
            return await _sheetmanager!.Demo();
        });

    private void TrackRateLimitMetricsAsync(string sheetId, string correlationId)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await _metricsService.TrackRateLimitHitAsync(sheetId);
                _logger.LogWarning("[{CorrelationId}] 📊 Rate limit metrics sent for sheet {SheetId}", correlationId, sheetId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{CorrelationId}] Failed to track rate limit metrics", correlationId);
            }
        });
    }
}
