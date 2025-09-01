using Amazon.CloudWatch;
using Amazon.CloudWatch.Model;
using System.Security.Cryptography;
using System.Text;

namespace GigRaptorService.Services;

public class MetricsService : IMetricsService
{
    private readonly IAmazonCloudWatch _cloudWatch;
    private readonly ILogger<MetricsService> _logger;
    private const string NAMESPACE = "RaptorGig/Lambda";

    public MetricsService(IAmazonCloudWatch cloudWatch, ILogger<MetricsService> logger)
    {
        _cloudWatch = cloudWatch;
        _logger = logger;
    }

    public async Task TrackCustomMetricAsync(string metricName, double value, string unit = "Count")
    {
        try
        {
            // Sanitize metric name for CloudWatch requirements
            var sanitizedName = SanitizeMetricName(metricName);
            
            var request = new PutMetricDataRequest
            {
                Namespace = NAMESPACE,
                MetricData = new List<MetricDatum>
                {
                    new MetricDatum
                    {
                        MetricName = sanitizedName,
                        Value = value,
                        Unit = GetStandardUnit(unit),
                        TimestampUtc = DateTime.UtcNow
                    }
                }
            };

            await _cloudWatch.PutMetricDataAsync(request);
            _logger.LogInformation("✅ Successfully sent metric {MetricName} = {Value} {Unit}", sanitizedName, value, unit);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send custom metric {MetricName}", metricName);
        }
    }

    public async Task TrackApiCallAsync(string endpoint, TimeSpan duration, bool success)
    {
        var tasks = new List<Task>
        {
            TrackCustomMetricAsync($"API.{endpoint}.Duration", duration.TotalMilliseconds, "Milliseconds"),
            TrackCustomMetricAsync($"API.{endpoint}.{(success ? "Success" : "Error")}", 1),
            TrackCustomMetricAsync("API.TotalCalls", 1)
        };

        await Task.WhenAll(tasks);
    }

    public async Task TrackSheetsOperationAsync(string operation, TimeSpan duration, bool success)
    {
        var tasks = new List<Task>
        {
            TrackCustomMetricAsync($"Sheets.{operation}.Duration", duration.TotalMilliseconds, "Milliseconds"),
            TrackCustomMetricAsync($"Sheets.{operation}.{(success ? "Success" : "Error")}", 1),
            TrackCustomMetricAsync("Sheets.TotalOperations", 1)
        };

        await Task.WhenAll(tasks);
    }

    public async Task TrackUserActivityAsync(string userId, string action)
    {
        try
        {
            // Hash userId for privacy
            var hashedUserId = HashUserId(userId);
            
            var tasks = new List<Task>
            {
                TrackCustomMetricAsync($"User.{action}", 1),
                TrackCustomMetricAsync("User.TotalActivity", 1)
            };

            await Task.WhenAll(tasks);
            
            _logger.LogInformation("User activity: {HashedUserId} performed {Action}", hashedUserId, action);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track user activity for action {Action}", action);
        }
    }

    public async Task TrackAuthenticationAsync(bool success)
    {
        var tasks = new List<Task>
        {
            TrackCustomMetricAsync($"Auth.{(success ? "Success" : "Failed")}", 1),
            TrackCustomMetricAsync("Auth.TotalAttempts", 1)
        };

        await Task.WhenAll(tasks);
    }

    public async Task TrackRateLimitHitAsync(string sheetId)
    {
        var hashedSheetId = HashUserId(sheetId); // Reuse hashing for sheet IDs
        
        await TrackCustomMetricAsync("RateLimit.Hit", 1);
        _logger.LogWarning("Rate limit hit for sheet: {HashedSheetId}", hashedSheetId);
    }

    public async Task TrackErrorAsync(string errorType, string endpoint = "")
    {
        var tasks = new List<Task>
        {
            TrackCustomMetricAsync($"Error.{errorType}", 1),
            TrackCustomMetricAsync("Error.Total", 1)
        };

        if (!string.IsNullOrEmpty(endpoint))
        {
            tasks.Add(TrackCustomMetricAsync($"Error.{endpoint}.{errorType}", 1));
        }

        await Task.WhenAll(tasks);
    }

    private StandardUnit GetStandardUnit(string unit)
    {
        return unit.ToLower() switch
        {
            "milliseconds" => StandardUnit.Milliseconds,
            "seconds" => StandardUnit.Seconds,
            "percent" => StandardUnit.Percent,
            "bytes" => StandardUnit.Bytes,
            "kilobytes" => StandardUnit.Kilobytes,
            "megabytes" => StandardUnit.Megabytes,
            _ => StandardUnit.Count
        };
    }

    private string HashUserId(string userId)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(userId));
        return Convert.ToHexString(hashedBytes)[..8]; // Take first 8 characters for brevity
    }

    private string SanitizeMetricName(string name)
    {
        if (string.IsNullOrEmpty(name)) return "Unknown";
        
        // CloudWatch metric names: alphanumeric, periods, hyphens, underscores, forward slashes, hash symbols, colons
        // But we'll keep it simple: replace problematic characters
        return name.Replace(" ", "_")
                  .Replace("\\", "_")
                  .Replace("\"", "_")
                  .Replace("'", "_");
    }
}
