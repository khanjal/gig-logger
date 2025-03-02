namespace GigRaptorService.Middleware;

public class SheetIdMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue("Sheet-Id", out var sheetId) || string.IsNullOrWhiteSpace(sheetId))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("Sheet-Id must be provided.");
            return;
        }

        // Add the Sheet-Id to the HttpContext.Items collection for later use
        context.Items["Sheet-Id"] = sheetId.ToString().Trim();

        await _next(context);
    }
}
