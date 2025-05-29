using GigRaptorService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;

    public AuthController(ILogger<AuthController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost]
    public async Task<IActionResult> Authenticate([FromBody] Dictionary<string, string> data)
    {
        if (!data.TryGetValue("code", out var code) || string.IsNullOrEmpty(code))
            return BadRequest(new { message = "Missing code." });

        if (!data.TryGetValue("codeVerifier", out var codeVerifier) || string.IsNullOrEmpty(codeVerifier))
            return BadRequest(new { message = "Missing code_verifier." });

        if (!data.TryGetValue("redirectUri", out var redirectUri) || string.IsNullOrEmpty(redirectUri))
            return BadRequest(new { message = "Missing redirectUri." });

        var clientId = _configuration["GoogleOAuth:ClientId"];
        var clientSecret = _configuration["GoogleOAuth:ClientSecret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            _logger.LogError("Google OAuth configuration is missing.");
            return StatusCode(500, new { message = "Server configuration error." });
        }

        var tokenResponse = await ExchangeAuthCodeForTokens(code, codeVerifier, redirectUri);

        if (string.IsNullOrEmpty(tokenResponse.RefreshToken))
        {
            _logger.LogWarning("Failed to obtain refresh token from Google for code: {Code}", code);
            return BadRequest(new { message = "Failed to obtain refresh token from Google." });
        }

        var encryptedToken = EncryptToken(tokenResponse.RefreshToken);

        var cookieOptions = new CookieOptions
        {
            Expires = DateTimeOffset.UtcNow.AddSeconds(tokenResponse.RefreshTokenExpiresIn),
            HttpOnly = true,
            Path = "/",
            SameSite = SameSiteMode.None,
            Secure = true,
        };

        Response.Cookies.Append("rg_refresh", encryptedToken, cookieOptions);

        return Ok(new { accessToken = tokenResponse.AccessToken });
    }

    [HttpPost("clear")]
    public IActionResult Clear()
    {
        Response.Cookies.Delete("rg_refresh");
        return Ok();
    }

    [HttpPost("refresh")]
    public IActionResult Refresh()
    {
        var refreshToken = Request.Cookies["rg_refresh"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "Refresh token is missing or invalid." });

        if (!ValidateRefreshToken(refreshToken))
            return Unauthorized(new { message = "Invalid refresh token." });

        var newAccessToken = GenerateAccessToken(refreshToken);
        return Ok(new { accessToken = newAccessToken });
    }

    private string EncryptToken(string token)
    {
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(token));
    }

    private bool ValidateRefreshToken(string refreshToken)
    {
        return !string.IsNullOrEmpty(refreshToken);
    }

    private async Task<GoogleTokenResponse> ExchangeAuthCodeForTokens(string authorizationCode, string codeVerifier, string redirectUri)
    {
        const string tokenEndpoint = "https://oauth2.googleapis.com/token";

        var clientId = _configuration["GoogleOAuth:ClientId"];
        var clientSecret = _configuration["GoogleOAuth:ClientSecret"];

        var requestBody = new Dictionary<string, string>
        {
            { "client_id", clientId! },
            { "client_secret", clientSecret! },
            { "code", authorizationCode },
            { "grant_type", "authorization_code" },
            { "redirect_uri", redirectUri },
            { "code_verifier", codeVerifier }
        };

        using var httpClient = new HttpClient();
        var requestContent = new FormUrlEncodedContent(requestBody);

        var response = await httpClient.PostAsync(tokenEndpoint, requestContent);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Failed to exchange auth code: {errorContent}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        var tokenResponse = System.Text.Json.JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);

        if (tokenResponse == null)
            throw new Exception("Failed to parse token response from Google.");

        return tokenResponse;
    }

    private async Task<string> GenerateAccessToken(string refreshToken)
    {
        const string tokenEndpoint = "https://oauth2.googleapis.com/token";

        var clientId = _configuration["GoogleOAuth:ClientId"];
        var clientSecret = _configuration["GoogleOAuth:ClientSecret"];

        var requestBody = new Dictionary<string, string>
        {
            { "client_id", clientId! },
            { "client_secret", clientSecret! },
            { "refresh_token", refreshToken },
            { "grant_type", "refresh_token" }
        };

        using var httpClient = new HttpClient();
        var requestContent = new FormUrlEncodedContent(requestBody);

        var response = await httpClient.PostAsync(tokenEndpoint, requestContent);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Failed to refresh access token: {errorContent}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        var tokenResponse = System.Text.Json.JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);

        if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            throw new Exception("Failed to retrieve access token from Google.");

        return tokenResponse.AccessToken;
    }
}
