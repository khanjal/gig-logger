using GigRaptorService.Helpers;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.AspNetCore.Mvc;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class AuthController : ControllerBase
{
    private const string RefreshTokenCookieName = "RG_REFRESH";
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly GoogleOAuthService _googleOAuthService;

    public AuthController(
        ILogger<AuthController> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        GoogleOAuthService googleOAuthService)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _googleOAuthService = googleOAuthService;
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

        var clientId = _configuration["Google_OAuth:Client_Id"];
        var clientSecret = _configuration["Google_OAuth:Client_Secret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            _logger.LogError("Google OAuth configuration is missing.");
            return StatusCode(500, new { message = "Server configuration error." });
        }

        var requestBody = new Dictionary<string, string>
        {
            { "client_id", clientId! },
            { "client_secret", clientSecret! },
            { "code", code },
            { "grant_type", "authorization_code" },
            { "redirect_uri", redirectUri },
            { "code_verifier", codeVerifier }
        };

        var tokenResponse = await RequestGoogleTokenAsync(requestBody);

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

        Response.Cookies.Append(RefreshTokenCookieName, encryptedToken, cookieOptions);

        return Ok(new { accessToken = tokenResponse.AccessToken });
    }

    [HttpPost("clear")]
    public IActionResult Clear()
    {
        Response.Cookies.Delete(RefreshTokenCookieName);
        return Ok();
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "Refresh token is missing or invalid." });

        if (!ValidateRefreshToken(refreshToken))
            return Unauthorized(new { message = "Invalid refresh token." });

        var tokenResponse = await _googleOAuthService.RefreshAccessTokenAsync(refreshToken);
        if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            return Unauthorized(new { message = "Failed to retrieve access token from Google." });

        return Ok(new { accessToken = tokenResponse.AccessToken });
    }

    private string EncryptToken(string token)
    {
        var key = _configuration["Encryption:Key"]!;
        return TokenEncryptionHelper.Encrypt(token, key);
    }

    private bool ValidateRefreshToken(string refreshToken)
    {
        return !string.IsNullOrEmpty(refreshToken);
    }

    private async Task<GoogleTokenResponse> RequestGoogleTokenAsync(Dictionary<string, string> requestBody)
    {
        const string tokenEndpoint = "https://oauth2.googleapis.com/token";
        var httpClient = _httpClientFactory.CreateClient();
        var requestContent = new FormUrlEncodedContent(requestBody);

        var response = await httpClient.PostAsync(tokenEndpoint, requestContent);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Failed to retrieve token from Google: {errorContent}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        var tokenResponse = System.Text.Json.JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);

        if (tokenResponse == null)
            throw new Exception("Failed to parse token response from Google.");

        return tokenResponse;
    }
}
