using GigRaptorService.Models;
using Microsoft.AspNetCore.Mvc;
using RaptorSheets.Core.Entities;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class AuthController : ControllerBase
{
    // POST api/auth
    [HttpPost]
    public IActionResult Authenticate([FromBody] PropertyEntity token)
    {
        // Example: Encrypt or sign the refresh token before storing it
        var encryptedToken = EncryptToken(token.Name); // Replace with your encryption logic

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true, // Prevent access via JavaScript
            SameSite = SameSiteMode.None, // Use None if cross-origin requests are required
            Secure = true, // Ensure the cookie is sent over HTTPS
            Expires = DateTime.UtcNow.AddDays(7) // Set an expiration time (e.g., 7 days)
        };

        // Set the refresh token cookie
        Response.Cookies.Append("refresh_token", encryptedToken, cookieOptions);

        return Ok();
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

        // Optionally, rotate the refresh token
        var newRefreshToken = RotateRefreshToken(refreshToken);

        // Update the refresh token cookie
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true,
            //Expires = DateTime.UtcNow.AddDays(7) // Set expiration for the new refresh token
        };
        Response.Cookies.Append("refresh_token", newRefreshToken, cookieOptions);

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


    // Helper method to rotate the refresh token
    private string RotateRefreshToken(string oldRefreshToken)
    {
        // Example: Generate a new refresh token
        // Replace this with your actual token rotation logic
        return Guid.NewGuid().ToString(); // Replace with secure token generation logic
    }
}
