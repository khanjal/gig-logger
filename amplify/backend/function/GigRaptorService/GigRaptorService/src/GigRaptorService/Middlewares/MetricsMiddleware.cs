using GigRaptorService.Services;
using System.Diagnostics;

namespace GigRaptorService.Middlewares;

public class MetricsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<MetricsMiddleware> _logger;

    public MetricsMiddleware(RequestDelegate next, ILogger<MetricsMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IMetricsService metricsService)
    {
        var stopwatch = Stopwatch.StartNew();
        var success = false;
        var endpoint = ExtractEndpointName(context.Request.Path);

        try
        {
            await _next(context);
            success = context.Response.StatusCode < 400;
        }
        catch (Exception ex)
        {
            success = false;
            
            // Track specific error types
            var errorType = ex.GetType().Name;
            _ = Task.Run(async () =>
            {
                try
                {
                    await metricsService.TrackErrorAsync(errorType, endpoint);
                }
                catch (Exception metricsEx)
                {
                    _logger.LogError(metricsEx, "Failed to track error metric for {ErrorType}", errorType);
                }
            });
            
            throw;
        }
        finally
        {
            stopwatch.Stop();
            
            _logger.LogInformation("🎯 API Call: {Endpoint} took {Duration}ms, success: {Success}", 
                endpoint, stopwatch.ElapsedMilliseconds, success);
            
            // Track API call metrics (fire and forget to not impact performance)
            _ = Task.Run(async () =>
            {
                try
                {
                    await metricsService.TrackApiCallAsync(endpoint, stopwatch.Elapsed, success);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to track API call metrics for {Endpoint}", endpoint);
                }
            });
        }
    }

    private string ExtractEndpointName(string path)
    {
        var segments = path?.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments == null || segments.Length == 0)
            return "unknown";

        // For paths like /sheets/trips, return "sheets-trips"
        // For paths like /auth/token, return "auth-token"
        if (segments.Length >= 2)
            return $"{segments[0]}-{segments[1]}";
        
        return segments[0];
    }
}
