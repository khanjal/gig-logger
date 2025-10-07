using GigRaptorService.Services;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Diagnostics;

namespace GigRaptorService.Attributes;

/// <summary>
/// Attribute to automatically track metrics for controller actions
/// </summary>
public class TrackMetricsAttribute : ActionFilterAttribute
{
    private readonly string? _customEndpointName;
    private readonly bool _trackUserActivity;
    
    public TrackMetricsAttribute(string? customEndpointName = null, bool trackUserActivity = true)
    {
        _customEndpointName = customEndpointName;
        _trackUserActivity = trackUserActivity;
    }

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        context.HttpContext.Items["MetricsStopwatch"] = stopwatch;
        context.HttpContext.Items["MetricsStartTime"] = DateTime.UtcNow;
        
        base.OnActionExecuting(context);
    }

    public override void OnActionExecuted(ActionExecutedContext context)
    {
        var stopwatch = context.HttpContext.Items["MetricsStopwatch"] as Stopwatch;
        var endpointName = _customEndpointName ?? GenerateEndpointName(context);
        var success = context.Exception == null && context.HttpContext.Response.StatusCode < 400;

        stopwatch?.Stop();
        
        // Track metrics in background
        _ = Task.Run(async () =>
        {
            try
            {
                var metricsService = context.HttpContext.RequestServices.GetService<IMetricsService>();
                var logger = context.HttpContext.RequestServices.GetService<ILogger<TrackMetricsAttribute>>();
                
                if (metricsService != null && stopwatch != null)
                {
                    await metricsService.TrackApiCallAsync(endpointName, stopwatch.Elapsed, success);
                    
                    // Log the API metrics for visibility
                    logger?.LogInformation("?? API metrics sent for {EndpointName}: success={Success}, duration={Duration:F4}ms", 
                        endpointName, success, stopwatch.Elapsed.TotalMilliseconds);
                    
                    if (_trackUserActivity)
                    {
                        var userId = GetUserId(context.HttpContext);
                        if (!string.IsNullOrEmpty(userId))
                        {
                            await metricsService.TrackUserActivityAsync(userId, endpointName);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                var logger = context.HttpContext.RequestServices.GetService<ILogger<TrackMetricsAttribute>>();
                logger?.LogError(ex, "Failed to track metrics for {EndpointName}", endpointName);
            }
        });

        base.OnActionExecuted(context);
    }

    private string GenerateEndpointName(ActionExecutedContext context)
    {
        var controllerName = context.RouteData.Values["controller"]?.ToString()?.ToLower() ?? "unknown";
        var actionName = context.RouteData.Values["action"]?.ToString()?.ToLower() ?? "unknown";
        
        return $"{controllerName}-{actionName}";
    }

    private string? GetUserId(HttpContext context)
    {
        // Try multiple sources for user ID
        return context.Items["AuthenticatedUserId"]?.ToString() ??
               context.Request.Headers["Sheet-Id"].FirstOrDefault() ??
               context.User?.Identity?.Name;
    }
}