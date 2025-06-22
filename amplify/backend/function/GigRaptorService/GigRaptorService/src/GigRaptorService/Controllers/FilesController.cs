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
    public async Task<ActionResult<SheetResponse>> Create([FromBody] PropertyEntity property)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(property?.Name))
            {
                return BadRequest(new { message = "Property name is required" });
            }

            InitializeSheetmanager();
            var sheet = await _fileManager!.CreateSheet(property.Name);

            if (sheet == null)
            {
                _logger.LogError("Failed to create sheet: FileManager.CreateSheet returned null");
                return StatusCode(500, new { message = "Failed to create sheet" });
            }

            try
            {
                var sheetManager = new SheetManager(GetAccessTokenFromHeader()!, sheet.Id, _configuration);
                var sheetData = await sheetManager.CreateSheet();

                if (sheetData == null)
                {
                    _logger.LogError("Failed to create sheet data: SheetManager.CreateSheet returned null");
                    return StatusCode(500, new { message = "Failed to create sheet data" });
                }

                // Access the SheetEntity and set its Properties
                if (sheetData.SheetEntity != null)
                {
                    sheetData.SheetEntity.Properties = sheet;
                    return Created($"/sheets/{sheet.Id}", sheetData);
                }
                else
                {
                    _logger.LogError("Failed to create sheet data: SheetEntity is null");
                    
                    // If the SheetEntity is null but we have an S3 link, still return the response
                    if (sheetData.IsStoredInS3 && !string.IsNullOrEmpty(sheetData.S3Link))
                    {
                        // Add sheet properties to metadata
                        sheetData.Metadata ??= new Dictionary<string, string>();
                        sheetData.Metadata["sheetId"] = sheet.Id;
                        sheetData.Metadata["sheetName"] = sheet.Name;
                        return Created($"/sheets/{sheet.Id}", sheetData);
                    }
                    
                    return StatusCode(500, new { message = "Failed to create sheet data: SheetEntity is null" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while initializing sheet data");
                return StatusCode(500, new { message = "Failed to initialize sheet data", error = ex.Message });
            }
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument during sheet creation");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating sheet");
            return StatusCode(500, new { message = "Failed to create sheet", error = ex.Message });
        }
    }
}
