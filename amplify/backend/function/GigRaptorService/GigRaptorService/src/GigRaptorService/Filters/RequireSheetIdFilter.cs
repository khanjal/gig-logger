using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace GigRaptorService.Filters;

public class RequireSheetIdFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.HttpContext.Request.Headers.TryGetValue("Sheet-Id", out var sheetId) || string.IsNullOrWhiteSpace(sheetId))
        {
            context.Result = new BadRequestObjectResult("Sheet-Id must be provided.");
            return;
        }

        // Add the Sheet-Id to the HttpContext.Items collection for later use
        context.HttpContext.Items["Sheet-Id"] = sheetId.ToString().Trim();
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // Do nothing
    }
}
