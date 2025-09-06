using GigRaptorService.Attributes;
using GigRaptorService.Business;
using GigRaptorService.Helpers;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.AspNetCore.Mvc;
using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;
using System.Net.Mime;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
[ApiController]
[Produces(MediaTypeNames.Application.Json)]
public class FilesController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FilesController> _logger;
    private readonly IMetricsService _metricsService;
    private readonly MetricsHelper _metricsHelper;
    private FileManager? _fileManager;

    public FilesController(IConfiguration configuration, ILogger<FilesController> logger, IMetricsService metricsService)
    {
        _configuration = configuration;
        _logger = logger;
        _metricsService = metricsService;
        _metricsHelper = new MetricsHelper(metricsService, logger);
    }

    private void InitializeSheetmanager()
    {
        var accessToken = GetAccessTokenFromHeader();
        // Middleware guarantees accessToken is valid
        _fileManager = new FileManager(accessToken!);
    }

    private string? GetAccessTokenFromHeader()
    {
        var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            return null;
        return authHeader.Substring("Bearer ".Length).Trim();
    }

    private string GetUserId()
    {
        // Try to get userId from HttpContext.Items (set by rate limiting middleware)
        return HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? "unknown";
    }

    // GET api/files/list
    [HttpGet("list")]
    [RateLimitFilter(10, 60, ApiType.Files)] // 10 requests per minute per user for Files API
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<PropertyEntity>>> GetAll()
    {
        try
        {
            var sheets = await _metricsHelper.ExecuteWithApiMetrics("files-list", async () =>
            {
                InitializeSheetmanager();
                return await _fileManager!.ListSheets();
            }, GetUserId(), result => result?.Count >= 0);

            await _metricsHelper.TrackCustomMetricAsync("Files.List.Count", sheets.Count);

            return Ok(sheets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while listing sheets");
            await _metricsHelper.TrackErrorAsync("ListSheetsError", "files-list");
            return StatusCode(500, new { message = "Failed to retrieve sheets", error = ex.Message });
        }
    }

    // POST api/files/create  
    [HttpPost("create")]
    [RateLimitFilter(5, 60, ApiType.Files)] // 5 requests per minute per user for Files API (creation is more resource-intensive)
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PropertyEntity>> Create([FromBody] PropertyEntity property)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(property?.Name))
            {
                return BadRequest(new { message = "Property name is required" });
            }

            var sheet = await _metricsHelper.ExecuteWithApiMetrics("files-create", async () =>
            {
                // Create the sheet
                InitializeSheetmanager();
                var createdSheet = await _fileManager!.CreateSheet(property.Name);
                
                if (createdSheet == null)
                {
                    _logger.LogError("Failed to create sheet: FileManager.CreateSheet returned null");
                    throw new InvalidOperationException("Failed to create sheet");
                }

                // Initialize the sheet data
                var sheetManager = new SheetManager(GetAccessTokenFromHeader()!, createdSheet.Id, _configuration);
                await sheetManager.CreateSheet();
                
                return createdSheet;
            }, GetUserId(), result => result != null);

            await _metricsHelper.TrackCustomMetricAsync("Files.Create.Success", 1);

            // Return the created property entity
            return Created($"/sheets/{sheet.Id}", sheet);
        }
        catch (ArgumentException ex)
        {
            // Handle validation errors specifically
            _logger.LogWarning(ex, "Invalid argument during sheet creation");
            await _metricsHelper.TrackErrorAsync("ValidationError", "files-create");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            // Handle all other errors
            _logger.LogError(ex, "Error occurred while creating sheet");
            await _metricsHelper.TrackErrorAsync("CreateSheetError", "files-create");
            return StatusCode(500, new { message = "Failed to create sheet", error = ex.Message });
        }
    }
}
