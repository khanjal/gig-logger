using GigRaptorService.Services;
using System.Diagnostics;

namespace GigRaptorService.Helpers;

public static class MetricsExtensions
{
    /// <summary>
    /// Executes an operation and automatically tracks its performance metrics
    /// </summary>
    public static async Task<T> TrackOperationAsync<T>(
        this IMetricsService metricsService,
        string operationName,
        Func<Task<T>> operation,
        string? userId = null)
    {
        var stopwatch = Stopwatch.StartNew();
        var success = false;

        try
        {
            var result = await operation();
            success = true;
            return result;
        }
        catch (Exception)
        {
            success = false;
            throw;
        }
        finally
        {
            stopwatch.Stop();
            
            // Track metrics without blocking (fire and forget)
            _ = Task.Run(async () =>
            {
                try
                {
                    await metricsService.TrackSheetsOperationAsync(operationName, stopwatch.Elapsed, success);
                    
                    if (!string.IsNullOrEmpty(userId))
                    {
                        await metricsService.TrackUserActivityAsync(userId, operationName);
                    }
                }
                catch
                {
                    // Silently fail - metrics shouldn't impact main operations
                }
            });
        }
    }

    /// <summary>
    /// Executes an operation and automatically tracks its performance metrics (void return)
    /// </summary>
    public static async Task TrackOperationAsync(
        this IMetricsService metricsService,
        string operationName,
        Func<Task> operation,
        string? userId = null)
    {
        var stopwatch = Stopwatch.StartNew();
        var success = false;

        try
        {
            await operation();
            success = true;
        }
        catch (Exception)
        {
            success = false;
            throw;
        }
        finally
        {
            stopwatch.Stop();
            
            // Track metrics without blocking (fire and forget)
            _ = Task.Run(async () =>
            {
                try
                {
                    await metricsService.TrackSheetsOperationAsync(operationName, stopwatch.Elapsed, success);
                    
                    if (!string.IsNullOrEmpty(userId))
                    {
                        await metricsService.TrackUserActivityAsync(userId, operationName);
                    }
                }
                catch
                {
                    // Silently fail - metrics shouldn't impact main operations
                }
            });
        }
    }
}
