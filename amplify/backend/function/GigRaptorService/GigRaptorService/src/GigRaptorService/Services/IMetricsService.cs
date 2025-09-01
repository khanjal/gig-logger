namespace GigRaptorService.Services;

public interface IMetricsService
{
    Task TrackCustomMetricAsync(string metricName, double value, string unit = "Count");
    Task TrackApiCallAsync(string endpoint, TimeSpan duration, bool success);
    Task TrackSheetsOperationAsync(string operation, TimeSpan duration, bool success);
    Task TrackUserActivityAsync(string userId, string action);
    Task TrackAuthenticationAsync(bool success);
    Task TrackRateLimitHitAsync(string sheetId);
    Task TrackErrorAsync(string errorType, string endpoint = "");
}
