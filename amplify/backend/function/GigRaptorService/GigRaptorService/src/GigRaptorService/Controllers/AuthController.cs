using GigRaptorService.Attributes;
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
    private readonly IMetricsService _metricsService;

    public AuthController(
        ILogger<AuthController> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        GoogleOAuthService googleOAuthService,
        IMetricsService metricsService)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _googleOAuthService = googleOAuthService;
        _metricsService = metricsService;
    }

    [HttpPost]
    [TrackMetrics("auth-authenticate")]
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

        try
        {
            var requestBody = new Dictionary<string, string>
            {
                { "client_id", clientId! },
                { "client_secret", clientSecret! },
                { "code", code },
                { "grant_type", "authorization_code" },
                { "redirect_uri", redirectUri },
                { "code_verifier", codeVerifier }
            };

            var tokenResponse = await _googleOAuthService.RequestGoogleTokenAsync(requestBody);

            if (string.IsNullOrEmpty(tokenResponse.RefreshToken))
            {
                _logger.LogWarning("Failed to obtain refresh token from Google for code: {Code}", code);
                
                await _metricsService.TrackAuthenticationAsync(false);
                
                return BadRequest(new { message = "Failed to obtain refresh token from Google." });
            }

            await _metricsService.TrackAuthenticationAsync(true);

            var encryptedToken = EncryptToken(tokenResponse.RefreshToken);

            Response.Cookies.Append(
                RefreshTokenCookieName,
                encryptedToken,
                GetRefreshTokenCookieOptions(DateTimeOffset.UtcNow.AddYears(1))
            );

            return Ok(new { accessToken = tokenResponse.AccessToken });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Authentication failed");
            await _metricsService.TrackAuthenticationAsync(false);
            await _metricsService.TrackErrorAsync("AuthenticationFailed", "auth-authenticate");
            return StatusCode(500, new { message = "Authentication failed", error = ex.Message });
        }
    }

    [HttpPost("clear")]
    [TrackMetrics("auth-clear")]
    public async Task<IActionResult> Clear()
    {
        Response.Cookies.Delete(
            RefreshTokenCookieName,
            GetRefreshTokenCookieOptions()
        );
        
        await Task.CompletedTask;
        return Ok();
    }

    [HttpPost("refresh")]
    [TrackMetrics("auth-refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "Refresh token is missing or invalid." });

        refreshToken = DecryptToken(refreshToken);

        if (!ValidateRefreshToken(refreshToken))
            return Unauthorized(new { message = "Invalid refresh token." });

        try
        {
            var tokenResponse = await _googleOAuthService.RefreshAccessTokenAsync(refreshToken);

            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            {
                await _metricsService.TrackAuthenticationAsync(false);
                return Unauthorized(new { message = "Failed to retrieve access token from Google." });
            }

            // Track successful token refresh
            await _metricsService.TrackUserActivityAsync("system", "TokenRefresh");

            return Ok(new { accessToken = tokenResponse.AccessToken });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh failed");
            await _metricsService.TrackAuthenticationAsync(false);
            await _metricsService.TrackErrorAsync("TokenRefreshFailed", "auth-refresh");
            return StatusCode(500, new { message = "Token refresh failed", error = ex.Message });
        }
    }

    private string DecryptToken(string encryptedToken)
    {
        var key = _configuration["Encryption:Key"]!;
        return TokenEncryptionHelper.Decrypt(encryptedToken, key);
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

    private CookieOptions GetRefreshTokenCookieOptions(DateTimeOffset? expires = null)
    {
        var options = new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true,
            Expires = expires
        };

        return options;
    }
}
