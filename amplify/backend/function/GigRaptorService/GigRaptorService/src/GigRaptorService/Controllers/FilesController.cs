using GigRaptorService.Attributes;
using GigRaptorService.Business;
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
    private FileManager? _fileManager;

    public FilesController(IConfiguration configuration, ILogger<FilesController> logger, IMetricsService metricsService)
    {
        _configuration = configuration;
        _logger = logger;
        _metricsService = metricsService;
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
    [TrackMetrics("files-list")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<PropertyEntity>>> GetAll()
    {
        try
        {
            InitializeSheetmanager();
            var sheets = await _fileManager!.ListSheets();

            await _metricsService.TrackCustomMetricAsync("Files.List.Count", sheets.Count);

            return Ok(sheets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while listing sheets");
            await _metricsService.TrackErrorAsync("ListSheetsError", "files-list");
            return StatusCode(500, new { message = "Failed to retrieve sheets", error = ex.Message });
        }
    }

    // POST api/files/create  
    [HttpPost("create")]
    [RateLimitFilter(5, 60, ApiType.Files)] // 5 requests per minute per user for Files API
    [TrackMetrics("files-create")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PropertyEntity>> Create([FromBody] SheetCreationRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request?.Name))
            {
                _logger.LogWarning("Create sheet request rejected: Name is required");
                return BadRequest(new { message = "Sheet name is required" });
            }

            InitializeSheetmanager();
            var createdSheet = await _fileManager!.CreateSheet(request.Name);

            await _metricsService.TrackCustomMetricAsync("Files.Create.Success", 1);

            _logger.LogInformation("📄 Sheet created successfully: {SheetName} with ID: {SheetId}", 
                createdSheet.Name, createdSheet.Id);

            return Ok(createdSheet);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating sheet: {SheetName}", request?.Name);
            await _metricsService.TrackErrorAsync("CreateSheetError", "files-create");
            return StatusCode(500, new { message = "Failed to create sheet", error = ex.Message });
        }
    }
}
