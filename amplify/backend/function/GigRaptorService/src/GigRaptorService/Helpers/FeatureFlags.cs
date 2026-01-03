public static class FeatureFlags
{
    public static bool IsRateLimitingEnabled(IConfiguration config)
        => config.GetValue<bool>("Features:EnableRateLimiting");
}
