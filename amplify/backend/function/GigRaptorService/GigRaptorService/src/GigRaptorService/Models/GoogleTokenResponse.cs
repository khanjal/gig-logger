namespace GigRaptorService.Models;

public class GoogleTokenResponse
{
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public string TokenType { get; set; }
    public int ExpiresIn { get; set; }
    public string Scope { get; set; }
}

