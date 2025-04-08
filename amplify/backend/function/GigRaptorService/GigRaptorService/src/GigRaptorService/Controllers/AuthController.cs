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
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true
        };

        Response.Cookies.Append("auth", token.Name, cookieOptions);

        return Ok(token.Name);
    }

    // POST api/auth
    [HttpPost("clear")]
    public IActionResult Clear()
    {
        Response.Cookies.Delete("auth");

        return Ok();
    }
}