using GigRaptorService.Business;
using Microsoft.AspNetCore.Mvc;
using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class FilesController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private FileManager? _fileManager;

    public FilesController(IConfiguration configuration)
    {
        _configuration = configuration;
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
    public async Task<List<PropertyEntity>?> GetAll()
    {
        InitializeSheetmanager();
        return await _fileManager!.ListSheets();
    }

    // POST api/files/create  
    [HttpPost("create")]
    public async Task<SheetEntity> Create([FromBody] PropertyEntity property)
    {
        InitializeSheetmanager();
        var sheet = await _fileManager!.CreateSheet(property.Name);

        if(sheet != null)
        {
            var sheetManager = new SheetManager(GetAccessTokenFromHeader()!, sheet.Id, _configuration);
            var sheetData = await sheetManager.CreateSheet();

            if (sheetData != null)
            {
                sheetData.Properties = sheet;
            }
            else
            {
                throw new Exception("Failed to create sheet data.");
            }

            return sheetData;
        }

        throw new Exception("Failed to create sheet.");
    }
}
