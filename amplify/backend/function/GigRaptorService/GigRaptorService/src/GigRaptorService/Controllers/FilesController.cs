using GigRaptorService.Business;
using GigRaptorService.Models;
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
    private FileManager? _fileManager;

    public FilesController(IConfiguration configuration, ILogger<FilesController> logger)
    {
        _configuration = configuration;
        _logger = logger;
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

    // GET api/files/list
    [HttpGet("list")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<PropertyEntity>>> GetAll()
    {
        try
        {
            InitializeSheetmanager();
            var sheets = await _fileManager!.ListSheets();
            return Ok(sheets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while listing sheets");
            return StatusCode(500, new { message = "Failed to retrieve sheets", error = ex.Message });
        }
    }

    // POST api/files/create  
    [HttpPost("create")]
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

            // Create the sheet
            InitializeSheetmanager();
            var sheet = await _fileManager!.CreateSheet(property.Name);
            
            if (sheet == null)
            {
                _logger.LogError("Failed to create sheet: FileManager.CreateSheet returned null");
                return StatusCode(500, new { message = "Failed to create sheet" });
            }

            // Initialize the sheet data
            var sheetManager = new SheetManager(GetAccessTokenFromHeader()!, sheet.Id, _configuration);
            await sheetManager.CreateSheet();
            
            // Return the created property entity
            return Created($"/sheets/{sheet.Id}", sheet);
        }
        catch (ArgumentException ex)
        {
            // Handle validation errors specifically
            _logger.LogWarning(ex, "Invalid argument during sheet creation");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            // Handle all other errors
            _logger.LogError(ex, "Error occurred while creating sheet");
            return StatusCode(500, new { message = "Failed to create sheet", error = ex.Message });
        }
    }
}
