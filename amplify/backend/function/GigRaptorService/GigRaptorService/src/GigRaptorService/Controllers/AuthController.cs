using Microsoft.AspNetCore.Mvc;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;

    public AuthController(ILogger<AuthController> logger)
    {
        _logger = logger;
    }

    // POST api/auth
    [HttpPost]
    public async Task<IActionResult> Authenticate([FromBody] Dictionary<string, string> data)
    {
        if (!data.TryGetValue("code", out var code) || string.IsNullOrEmpty(code))
            return BadRequest(new { message = "Missing code." });

        if (!data.TryGetValue("codeVerifier", out var codeVerifier) || string.IsNullOrEmpty(codeVerifier))
            return BadRequest(new { message = "Missing code_verifier." });

        if (!data.TryGetValue("redirectUri", out var redirectUri) || string.IsNullOrEmpty(redirectUri))
            return BadRequest(new { message = "Missing redirectUri." });

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
            SameSite = SameSiteMode.None,
            Secure = true,
        };

        Response.Cookies.Append("refresh_token", encryptedToken, cookieOptions);

        return Ok(new { accessToken = tokenResponse.AccessToken });
    }


    // POST api/auth/clear
    [HttpPost("clear")]
    public IActionResult Clear()
    {
        Response.Cookies.Delete("refresh_token"); // Ensure the cookie name matches
        return Ok();
    }

    // POST api/auth/refresh
    [HttpPost("refresh")]
    public IActionResult Refresh()
    {
        // Retrieve the refresh token from the cookie
        var refreshToken = Request.Cookies["refresh_token"];
        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { message = "Refresh token is missing or invalid." });
        }

        // Validate the refresh token (replace with your validation logic)
        if (!ValidateRefreshToken(refreshToken))
        {
            return Unauthorized(new { message = "Invalid refresh token." });
        }

        // Generate a new access token
        var newAccessToken = GenerateAccessToken(refreshToken);


        // Return the new access token
        return Ok(new { accessToken = newAccessToken });
    }

    // Helper method to encrypt or sign the refresh token
    private string EncryptToken(string token)
    {
        // Replace with your encryption logic (e.g., AES encryption or signing with HMAC)
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(token));
    }

    // Helper method to validate the refresh token
    private bool ValidateRefreshToken(string refreshToken)
    {
        // Example: Validate the refresh token (e.g., check signature, expiration, etc.)
        // Replace this with your actual validation logic
        return !string.IsNullOrEmpty(refreshToken);
    }

    private async Task<GoogleTokenResponse> ExchangeAuthCodeForTokens(string authorizationCode, string codeVerifier, string redirectUri)
    {
        const string tokenEndpoint = "https://oauth2.googleapis.com/token";

        var requestBody = new Dictionary<string, string>
    {
        { "client_id", "1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com" }, // Replace with your Google Client ID
        { "client_secret", "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" }, // Replace with your Google Client Secret
        { "code", authorizationCode },
        { "grant_type", "authorization_code" },
        { "redirect_uri", redirectUri }, // Use the provided redirectUri
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
        {
            throw new Exception("Failed to parse token response from Google.");
        }

        return tokenResponse;
    }


    // Helper method to generate a new access token
    private async Task<string> GenerateAccessToken(string refreshToken)
    {
        // Google OAuth 2.0 token endpoint
        const string tokenEndpoint = "https://oauth2.googleapis.com/token";

        // Prepare the request payload
        var requestBody = new Dictionary<string, string>
        {
            { "client_id", "1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com" }, // Replace with your Google Client ID
            { "client_secret", "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" }, // Replace with your Google Client Secret
            { "refresh_token", refreshToken }, // The refresh token from the cookie
            { "grant_type", "refresh_token" } // Grant type for refresh token
        };

        using var httpClient = new HttpClient();
        var requestContent = new FormUrlEncodedContent(requestBody);

        // Send the POST request to Google's token endpoint
        var response = await httpClient.PostAsync(tokenEndpoint, requestContent);

        if (!response.IsSuccessStatusCode)
        {
            // Handle error response
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Failed to refresh access token: {errorContent}");
        }

        // Parse the response to extract the new access token
        var responseContent = await response.Content.ReadAsStringAsync();
        var tokenResponse = System.Text.Json.JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);

        if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
        {
            throw new Exception("Failed to retrieve access token from Google.");
        }

        return tokenResponse.AccessToken;
    }
}
