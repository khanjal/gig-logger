using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using GigRaptorService.Helpers;
using GigRaptorService.Models;
using Microsoft.Extensions.Configuration;

namespace GigRaptorService.Middlewares;

public class TokenRefreshMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TokenRefreshMiddleware> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public TokenRefreshMiddleware(
        RequestDelegate next,
        ILogger<TokenRefreshMiddleware> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _next = next;
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }


    public async Task InvokeAsync(HttpContext context)
    {
        var accessToken = context.Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
        var encryptedRefreshToken = context.Request.Cookies["RG_REFRESH"];
        string? refreshToken = null;

        if (!string.IsNullOrEmpty(encryptedRefreshToken))
        {
            refreshToken = DecryptToken(encryptedRefreshToken);
        }

        // If access token is present and valid, proceed without using the refresh token
        if (!string.IsNullOrEmpty(accessToken) && !IsJwtExpired(accessToken))
        {
            await _next(context);
            return;
        }

        // Only attempt to use the refresh token if we need a new access token
        if (string.IsNullOrEmpty(refreshToken))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("Refresh token is missing or expired.");
            return;
        }

        try
        {
            // Try to get a new access token using the refresh token
            var newAccessToken = await RefreshAccessTokenAsync(refreshToken, context);
            if (string.IsNullOrEmpty(newAccessToken))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Failed to refresh access token.");
                return;
            }

            // Set the new access token in a response header for the client
            context.Response.Headers["ACCESS_TOKEN"] = newAccessToken;

            // Update the Authorization header for downstream
            context.Request.Headers["Authorization"] = $"Bearer {newAccessToken}";

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing access token.");
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("Failed to refresh access token.");
        }
    }

    private string DecryptToken(string encryptedToken)
    {
        var key = _configuration["Encryption:Key"]!;
        return TokenEncryptionHelper.Decrypt(encryptedToken, key);
    }

    private bool IsJwtExpired(string jwt)
    {
        var handler = new JwtSecurityTokenHandler();
        if (!handler.CanReadToken(jwt)) return true;
        var token = handler.ReadJwtToken(jwt);
        var exp = token.Claims.FirstOrDefault(c => c.Type == "exp")?.Value;
        if (exp == null) return true;
        var expDate = DateTimeOffset.FromUnixTimeSeconds(long.Parse(exp));
        return expDate < DateTimeOffset.UtcNow;
    }

    private async Task<string?> RefreshAccessTokenAsync(string refreshToken, HttpContext context)
    {
        var clientId = _configuration["Google_OAuth:Client_Id"];
        var clientSecret = _configuration["Google_OAuth:Client_Secret"];
        var tokenEndpoint = "https://oauth2.googleapis.com/token";

        var requestBody = new Dictionary<string, string>
        {
            { "client_id", clientId! },
            { "client_secret", clientSecret! },
            { "refresh_token", refreshToken },
            { "grant_type", "refresh_token" }
        };

        var httpClient = _httpClientFactory.CreateClient();
        var requestContent = new FormUrlEncodedContent(requestBody);
        var response = await httpClient.PostAsync(tokenEndpoint, requestContent);

        if (!response.IsSuccessStatusCode)
            return null;

        var responseContent = await response.Content.ReadAsStringAsync();
        var tokenResponse = JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);

        return tokenResponse?.AccessToken;
    }
}
