using System.Collections.Concurrent;

namespace GigRaptorService.Business;

public class RateLimiter
{
    private static readonly ConcurrentDictionary<string, RateLimitInfo> RateLimitCache = new();
    private static readonly int MaxRequests = 10; // Maximum requests allowed
    private static readonly TimeSpan TimeWindow = TimeSpan.FromMinutes(1); // Time window for rate limiting
    private static readonly TimeSpan ExpirationTime = TimeSpan.FromMinutes(5); // Time to keep inactive entries
    private static DateTime _lastCleanupTime = DateTime.MinValue;

    public static bool IsRequestAllowed(string spreadsheetId)
    {
        var now = DateTime.UtcNow;

        // Get or initialize the rate limit info for the given SpreadsheetId
        var rateLimitInfo = RateLimitCache.GetOrAdd(spreadsheetId, _ => new RateLimitInfo
        {
            RequestCount = 0,
            LastRequestTime = now
        });

        lock (rateLimitInfo)
        {
            // Check if the time window has passed
            if ((now - rateLimitInfo.LastRequestTime) > TimeWindow)
            {
                // Reset the rate limit
                rateLimitInfo.RequestCount = 1;
                rateLimitInfo.LastRequestTime = now;
                return true;
            }

            // Check if the request count exceeds the limit
            if (rateLimitInfo.RequestCount >= MaxRequests)
            {
                return false; // Rate limit exceeded
            }

            // Increment the request count
            rateLimitInfo.RequestCount++;
            rateLimitInfo.LastRequestTime = now;
            return true;
        }
    }
    public static void MaybeCleanupExpiredEntries()
    {
        var now = DateTime.UtcNow;

        // Perform cleanup only if the last cleanup was more than 5 minutes ago
        if ((now - _lastCleanupTime) > TimeSpan.FromMinutes(5))
        {
            CleanupExpiredEntries();
            _lastCleanupTime = now;
        }
    }

    public static void CleanupExpiredEntries()
    {
        var now = DateTime.UtcNow;

        foreach (var key in RateLimitCache.Keys)
        {
            if (RateLimitCache.TryGetValue(key, out var rateLimitInfo))
            {
                lock (rateLimitInfo)
                {
                    // Remove entries that have been inactive for longer than the expiration time
                    if ((now - rateLimitInfo.LastRequestTime) > ExpirationTime)
                    {
                        RateLimitCache.TryRemove(key, out _);
                    }
                }
            }
        }
    }

    private class RateLimitInfo
    {
        public int RequestCount { get; set; }
        public DateTime LastRequestTime { get; set; }
    }
}

