using System.Text.Json;
using GigRaptorService.Models;

namespace GigRaptorService.Services;

public class GoogleOAuthService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public GoogleOAuthService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<GoogleTokenResponse?> RefreshAccessTokenAsync(string refreshToken)
    {
        var clientId = _configuration["Google_OAuth:Client_Id"];
        var clientSecret = _configuration["Google_OAuth:Client_Secret"];
        var tokenEndpoint = "https://oauth2.googleapis.com/token";

        var requestBody = new Dictionary<string, string>
        {
            { "client_id", clientId! },
            { "client_secret", clientSecret! },
            { "refresh_token", refreshToken },
            { "grant_type", "refresh_token" }
        };

        var httpClient = _httpClientFactory.CreateClient();
        var requestContent = new FormUrlEncodedContent(requestBody);
        var response = await httpClient.PostAsync(tokenEndpoint, requestContent);

        if (!response.IsSuccessStatusCode)
            return null;

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);
    }

    public async Task<GoogleTokenResponse?> ExchangeAuthCodeForTokensAsync(string code, string codeVerifier, string redirectUri)
    {
        var clientId = _configuration["Google_OAuth:Client_Id"];
        var clientSecret = _configuration["Google_OAuth:Client_Secret"];
        var tokenEndpoint = "https://oauth2.googleapis.com/token";

        var requestBody = new Dictionary<string, string>
        {
            { "client_id", clientId! },
            { "client_secret", clientSecret! },
            { "code", code },
            { "grant_type", "authorization_code" },
            { "redirect_uri", redirectUri },
            { "code_verifier", codeVerifier }
        };

        var httpClient = _httpClientFactory.CreateClient();
        var requestContent = new FormUrlEncodedContent(requestBody);
        var response = await httpClient.PostAsync(tokenEndpoint, requestContent);

        if (!response.IsSuccessStatusCode)
            return null;

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);
    }

    public async Task<GoogleTokenResponse> RequestGoogleTokenAsync(Dictionary<string, string> requestBody)
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
