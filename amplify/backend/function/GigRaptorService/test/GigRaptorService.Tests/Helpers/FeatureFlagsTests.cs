using GigRaptorService.Helpers;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace GigRaptorService.Tests.Helpers;

public class FeatureFlagsTests
{
    [Fact]
    public void IsRateLimitingEnabled_WhenTrue_ReturnsTrue()
    {
        // Arrange
        var config = CreateConfiguration(new Dictionary<string, string>
        {
            ["Features:EnableRateLimiting"] = "true"
        });

        // Act
        var result = FeatureFlags.IsRateLimitingEnabled(config);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsRateLimitingEnabled_WhenFalse_ReturnsFalse()
    {
        // Arrange
        var config = CreateConfiguration(new Dictionary<string, string>
        {
            ["Features:EnableRateLimiting"] = "false"
        });

        // Act
        var result = FeatureFlags.IsRateLimitingEnabled(config);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsRateLimitingEnabled_WhenNotSet_ReturnsFalse()
    {
        // Arrange
        var config = CreateConfiguration(new Dictionary<string, string>());

        // Act
        var result = FeatureFlags.IsRateLimitingEnabled(config);

        // Assert
        Assert.False(result);
    }

    private static IConfiguration CreateConfiguration(Dictionary<string, string> values)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values!)
            .Build();
    }
}
