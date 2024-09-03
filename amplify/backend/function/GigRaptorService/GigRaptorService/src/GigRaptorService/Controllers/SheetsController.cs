using GigRaptorLib.Entities;
using GigRaptorService.Business;
using GigRaptorService.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class SheetsController : ControllerBase
{
    private ISheetManager _sheetmanager;

    private void InitializeSheetmanger()
    {
        // TODO: Make this a middleware check too.
        if (!Request.Headers.TryGetValue("SheetId", out StringValues headerValues))
        {
            throw new Exception("SheetId must be provided.");
        }

        _sheetmanager = new SheetManager(ConfigurationHelper.GetJsonCredential(), headerValues!.ToString().Trim());
    }

    // GET api/sheets/get
    [HttpGet("get")]
    public async Task<SheetEntity?> Get()
    {
        InitializeSheetmanger();
        return await _sheetmanager.GetSheets();
    }

    // GET api/sheets/get/shifts
    [HttpGet("get/{sheetName}")]
    public async Task<SheetEntity?> Get(string sheetName)
    {
        InitializeSheetmanger();
        return await _sheetmanager.GetSheet(sheetName);
    }

    // GET api/sheets/check
    [HttpGet("check/")]
    public async Task<List<MessageEntity>> Check()
    {
        InitializeSheetmanger();
        return await _sheetmanager.CheckSheets();
    }

    // GET api/sheets/health
    [HttpGet("health/")]
    public async Task<bool> health()
    {
        InitializeSheetmanger();
        return !string.IsNullOrEmpty(await _sheetmanager.GetName());
    }

    // POST api/sheets/create
    [HttpPost("create")]
    public async Task<SheetEntity> Post()
    {
        InitializeSheetmanger();
        return await _sheetmanager.CreateSheet();
    }

    // POST api/sheets/add
    [HttpPost("add")]
    public async Task<SheetEntity> Post([FromBody] SheetEntity sheetEntity)
    {
        InitializeSheetmanger();
        return await _sheetmanager.AddData(sheetEntity);
    }

    // PUT api/sheets/5
    [HttpPut("{id}")]
    public void Put(int id, [FromBody] string value)
    {
    }

    // DELETE api/sheets/5
    [HttpDelete("{id}")]
    public void Delete(int id)
    {
    }
}