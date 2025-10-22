namespace GigRaptorService.Models;

public class SheetHeaders
{
    [Microsoft.AspNetCore.Mvc.FromHeader(Name = "Sheet-Id")]
    public string? SheetId { get; set; }

    [Microsoft.AspNetCore.Mvc.FromHeader(Name = "Authorization")]
    public string? Authorization { get; set; }
}
