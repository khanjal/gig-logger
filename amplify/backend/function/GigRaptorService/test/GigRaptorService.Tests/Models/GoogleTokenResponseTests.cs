using GigRaptorService.Models;
using Xunit;

namespace GigRaptorService.Tests.Models;

public class GoogleTokenResponseTests
{
    [Fact]
    public void GoogleTokenResponse_CanSetAllProperties()
    {
        // Arrange & Act
        var response = new GoogleTokenResponse
        {
            AccessToken = "access-123",
            RefreshToken = "refresh-456",
            IdToken = "id-789",
            TokenType = "Bearer",
            ExpiresIn = 3600,
            Scope = "openid profile",
            RefreshTokenExpiresIn = 86400
        };

        // Assert
        Assert.Equal("access-123", response.AccessToken);
        Assert.Equal("refresh-456", response.RefreshToken);
        Assert.Equal("id-789", response.IdToken);
        Assert.Equal("Bearer", response.TokenType);
        Assert.Equal(3600, response.ExpiresIn);
        Assert.Equal("openid profile", response.Scope);
        Assert.Equal(86400, response.RefreshTokenExpiresIn);
    }

    [Fact]
    public void GoogleTokenResponse_PropertiesHaveDefaults()
    {
        // Arrange & Act
        var response = new GoogleTokenResponse();

        // Assert
        Assert.Equal(string.Empty, response.AccessToken);
        Assert.Equal(string.Empty, response.RefreshToken);
        Assert.Equal(0, response.ExpiresIn);
        Assert.Equal(string.Empty, response.TokenType);
        Assert.Equal(string.Empty, response.IdToken);
        Assert.Equal(string.Empty, response.Scope);
        Assert.Equal(0, response.RefreshTokenExpiresIn);
    }
}
