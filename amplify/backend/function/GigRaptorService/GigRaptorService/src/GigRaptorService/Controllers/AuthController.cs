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
        // var encryptedToken = EncryptToken(token.Name); // Replace with your encryption logic

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true, // Prevent access via JavaScript
            SameSite = SameSiteMode.None, // Use None if cross-origin requests are required
            Secure = true, // Ensure the cookie is sent over HTTPS
            // Expires = DateTime.UtcNow.AddDays(7) // Set an expiration time (e.g., 7 days)
        };

        // Set the refresh token cookie
        Response.Cookies.Append("refresh_token", token.Name, cookieOptions);

        return Ok();
    }

    // POST api/auth
    [HttpPost("clear")]
    public IActionResult Clear()
    {
        Response.Cookies.Delete("auth");

        return Ok();
    }
}