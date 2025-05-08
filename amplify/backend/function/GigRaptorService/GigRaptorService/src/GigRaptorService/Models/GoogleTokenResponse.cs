namespace GigRaptorService.Models;

public class GoogleTokenResponse
{
    public string AccessToken { get; set; } // Maps to "access_token" in the response
    public string TokenType { get; set; } // Maps to "token_type" in the response
    public int ExpiresIn { get; set; } // Maps to "expires_in" in the response
    public string Scope { get; set; } // Maps to "scope" in the response
}
