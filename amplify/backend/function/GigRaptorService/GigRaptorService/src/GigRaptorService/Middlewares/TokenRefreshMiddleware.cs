using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using GigRaptorService.Models;

namespace GigRaptorService.Middlewares;

public class TokenRefreshMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TokenRefreshMiddleware> _logger;

    public TokenRefreshMiddleware(RequestDelegate next, ILogger<TokenRefreshMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var accessToken = context.Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
        var encryptedRefreshToken = context.Request.Cookies["rg_refresh"];
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
                // If we can't get a new access token, do NOT attempt to refresh the refresh token
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Failed to refresh access token.");
                return;
            }

            // Set the new access token in a response header for the client
            context.Response.Headers["X-New-Access-Token"] = newAccessToken;

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
        var bytes = Convert.FromBase64String(encryptedToken);
        return System.Text.Encoding.UTF8.GetString(bytes);
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
        var clientId = "1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com";
        var clientSecret = "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";
        var tokenEndpoint = "https://oauth2.googleapis.com/token";

        var requestBody = new Dictionary<string, string>
        {
            { "client_id", clientId },
            { "client_secret", clientSecret },
            { "refresh_token", refreshToken },
            { "grant_type", "refresh_token" }
        };

        using var httpClient = new HttpClient();
        var requestContent = new FormUrlEncodedContent(requestBody);
        var response = await httpClient.PostAsync(tokenEndpoint, requestContent);

        if (!response.IsSuccessStatusCode)
            return null;

        var responseContent = await response.Content.ReadAsStringAsync();
        var tokenResponse = JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);

        return tokenResponse?.AccessToken;
    }
}
