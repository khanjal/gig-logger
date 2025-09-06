using GigRaptorService.Models;
using GigRaptorService.Services;
using RaptorSheets.Gig.Entities;
using System.Diagnostics;

namespace GigRaptorService.Helpers;

/// <summary>
/// Helper class for standardized metrics tracking across controllers
/// </summary>
public class MetricsHelper
{
    private readonly IMetricsService _metricsService;
    private readonly ILogger _logger;

    public MetricsHelper(IMetricsService metricsService, ILogger logger)
    {
        _metricsService = metricsService;
        _logger = logger;
    }

    /// <summary>
    /// Executes an operation with automatic timing and basic metrics tracking
    /// </summary>
    public async Task<T> ExecuteWithMetrics<T>(
        string operationName, 
        Func<Task<T>> operation, 
        string? userId = null,
        string? additionalInfo = null)
    {
        var stopwatch = Stopwatch.StartNew();
        var success = false;

        try
        {
            var result = await operation();
            success = result != null;
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
            
            // Track metrics in background to not block response
            _ = Task.Run(async () =>
            {
                try
                {
                    await _metricsService.TrackSheetsOperationAsync(operationName, stopwatch.Elapsed, success);
                    
                    if (!string.IsNullOrEmpty(userId))
                    {
                        await _metricsService.TrackUserActivityAsync(userId, operationName);
                    }
                    
                    if (!string.IsNullOrEmpty(additionalInfo))
                    {
                        await _metricsService.TrackCustomMetricAsync($"{operationName}.AdditionalInfo", 1);
                    }
                    
                    _logger.LogInformation("?? {Operation} metrics sent successfully", operationName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to track {Operation} metrics", operationName);
                }
            });
        }
    }

    /// <summary>
    /// Executes Save operation with specialized metrics tracking including data volume
    /// </summary>
    public async Task<T> ExecuteWithSaveMetrics<T>(Func<Task<T>> operation, SheetEntity sheetEntity)
    {
        var stopwatch = Stopwatch.StartNew();
        var success = false;
        var sheetId = sheetEntity.Properties.Id ?? "";

        try
        {
            var result = await operation();
            
            // For SheetResponse, check if it has error messages
            if (result is SheetResponse sheetResponse)
            {
                success = sheetResponse != null && (sheetResponse.SheetEntity?.Messages?.Any(m => m.Level.ToLower() == "error") != true);
            }
            else
            {
                success = result != null;
            }
            
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
            
            // Track specialized save metrics in background
            _ = Task.Run(async () =>
            {
                try
                {
                    await _metricsService.TrackSheetsOperationAsync("SaveData", stopwatch.Elapsed, success);
                    await _metricsService.TrackUserActivityAsync(sheetId, "DataSync");
                    
                    // Track data volume - be defensive about property access
                    var totalItems = (sheetEntity.Trips?.Count ?? 0) + 
                                   (sheetEntity.Shifts?.Count ?? 0);
                    
                    // Add other collections if they exist
                    try
                    {
                        // Use reflection to safely check for other collections
                        var entityType = sheetEntity.GetType();
                        var expensesProperty = entityType.GetProperty("Expenses");
                        if (expensesProperty != null)
                        {
                            var expenses = expensesProperty.GetValue(sheetEntity) as System.Collections.ICollection;
                            totalItems += expenses?.Count ?? 0;
                        }
                    }
                    catch
                    {
                        // Ignore reflection errors
                    }
                    
                    await _metricsService.TrackCustomMetricAsync("Sheets.SaveData.ItemCount", totalItems);
                    _logger.LogInformation("?? Save data metrics sent successfully");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to track save data metrics");
                }
            });
        }
    }

    /// <summary>
    /// Executes an operation with automatic timing and API-specific metrics tracking
    /// </summary>
    public async Task<T> ExecuteWithApiMetrics<T>(
        string endpoint,
        Func<Task<T>> operation,
        string? userId = null,
        Func<T, bool>? successEvaluator = null)
    {
        var stopwatch = Stopwatch.StartNew();
        var success = false;

        try
        {
            var result = await operation();
            success = successEvaluator?.Invoke(result) ?? (result != null);
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
            
            // Track API metrics in background
            _ = Task.Run(async () =>
            {
                try
                {
                    await _metricsService.TrackApiCallAsync(endpoint, stopwatch.Elapsed, success);
                    
                    if (!string.IsNullOrEmpty(userId))
                    {
                        await _metricsService.TrackUserActivityAsync(userId, endpoint);
                    }
                    
                    _logger.LogInformation("?? API metrics sent for {Endpoint}: success={Success}, duration={Duration}ms", 
                        endpoint, success, stopwatch.Elapsed.TotalMilliseconds);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to track API metrics for {Endpoint}", endpoint);
                }
            });
        }
    }

    /// <summary>
    /// Tracks authentication-related metrics
    /// </summary>
    public async Task TrackAuthenticationAsync(bool success)
    {
        try
        {
            await _metricsService.TrackAuthenticationAsync(success);
            _logger.LogInformation("?? Authentication metrics sent: {Success}", success);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track authentication metrics");
        }
    }

    /// <summary>
    /// Tracks error metrics with context
    /// </summary>
    public async Task TrackErrorAsync(string errorType, string endpoint = "")
    {
        try
        {
            await _metricsService.TrackErrorAsync(errorType, endpoint);
            _logger.LogInformation("?? Error metrics sent: {ErrorType} at {Endpoint}", errorType, endpoint);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track error metrics");
        }
    }

    /// <summary>
    /// Tracks custom metrics with value
    /// </summary>
    public async Task TrackCustomMetricAsync(string metricName, double value, string unit = "Count")
    {
        try
        {
            await _metricsService.TrackCustomMetricAsync(metricName, value, unit);
            _logger.LogInformation("?? Custom metric sent: {MetricName} = {Value} {Unit}", metricName, value, unit);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track custom metric {MetricName}", metricName);
        }
    }
}