using System.Text.Json;
using System.Text.Json.Serialization;
using GigRaptorService.Business;
using GigRaptorService.Models;

namespace GigRaptorService.Services;

public interface IGooglePlacesService
{
    Task<List<AutocompleteResult>> GetAutocompleteAsync(string query, string userId, string searchType = "address", string country = "US", double? userLat = null, double? userLng = null);
    Task<PlaceDetails?> GetPlaceDetailsAsync(string placeId, string userId);
}

public class GooglePlacesService : IGooglePlacesService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly DynamoDbRateLimiter _rateLimiter;
    private readonly string _apiKey;
    private readonly ILogger<GooglePlacesService>? _logger;

    public GooglePlacesService(
        HttpClient httpClient, 
        IConfiguration configuration, 
        DynamoDbRateLimiter rateLimiter,
        ILogger<GooglePlacesService>? logger = null)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _rateLimiter = rateLimiter;
        _logger = logger;
        _apiKey = _configuration["GooglePlaces:ApiKey"] ?? throw new InvalidOperationException("Google Places API key not configured");
    }

    public async Task<List<AutocompleteResult>> GetAutocompleteAsync(string query, string userId, string searchType = "address", string country = "US", double? userLat = null, double? userLng = null)
    {
        // Only check DynamoDB rate limits if feature flag is enabled
        if (FeatureFlags.IsRateLimitingEnabled(_configuration) && !await _rateLimiter.IsRequestAllowedAsync(userId))
        {
            throw new QuotaExceededException($"Rate limit exceeded for user {userId}");
        }

        try
        {
            // Using the new Places API Text Search for autocomplete-like functionality
            var url = "https://places.googleapis.com/v1/places:searchText";

            // Determine location bias based on provided user location or default to US center
            object locationBias;
            if (userLat.HasValue && userLng.HasValue)
            {
                // Use user's location if provided
                locationBias = new 
                {
                    circle = new
                    {
                        center = new { latitude = userLat.Value, longitude = userLng.Value },
                        radius = 50000.0 // 50km radius around user's location
                    }
                };
            }
            else
            {
                // Default to US geographic center
                locationBias = new 
                {
                    circle = new
                    {
                        center = new { latitude = 39.8283, longitude = -98.5795 }, // Geographic center of US
                        radius = 50000.0 // 50km radius (maximum allowed by API)
                    }
                };
            }
            
            var requestBody = new
            {
                textQuery = query,
                pageSize = 10,
                languageCode = "en",
                regionCode = country,
                locationBias = locationBias
            };

            var requestJson = JsonSerializer.Serialize(requestBody);
            _logger?.LogDebug("Google Places autocomplete request for query: {Query}, country: {Country}", query, country);

            var requestContent = new StringContent(
                requestJson,
                System.Text.Encoding.UTF8,
                "application/json");

            // Set required headers for new Places API
            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = requestContent
            };
            request.Headers.Add("X-Goog-Api-Key", _apiKey);
            request.Headers.Add("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.types");
            
            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                _logger?.LogError("Google Places API error: {Status} - {Content}", response.StatusCode, responseContent);
                throw new HttpRequestException($"Response status code does not indicate success: {response.StatusCode} ({response.ReasonPhrase})");
            }

            var googleResponse = JsonSerializer.Deserialize<PlacesSearchTextResponse>(responseContent);

            if (googleResponse?.Places == null)
            {
                _logger?.LogInformation("No places returned from Google Places API for query: {Query}", query);
                return new List<AutocompleteResult>();
            }

            var results = new List<AutocompleteResult>();
            
            foreach (var place in googleResponse.Places)
            {
                if (place?.DisplayName?.Text == null) continue;
                
                results.Add(new AutocompleteResult
                {
                    Place = place.DisplayName.Text,
                    Address = place.FormattedAddress ?? "",
                    PlaceDetails = new PlaceDetails
                    {
                        PlaceId = place.Id,
                        Name = place.DisplayName.Text,
                        FormattedAddress = place.FormattedAddress
                    }
                });
            }

            _logger?.LogDebug("Google Places autocomplete returned {Count} results for query: {Query}", results.Count, query);
            return results;
        }
        catch (HttpRequestException ex)
        {
            _logger?.LogError(ex, "HTTP error calling Google Places API for autocomplete: {Message}", ex.Message);
            throw new Exception($"Error calling Google Places API: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Unexpected error calling Google Places API for autocomplete: {Message}", ex.Message);
            throw new Exception($"Unexpected error calling Google Places API: {ex.Message}", ex);
        }
    }

    public async Task<PlaceDetails?> GetPlaceDetailsAsync(string placeId, string userId)
    {
        // Only check DynamoDB rate limits if feature flag is enabled
        if (FeatureFlags.IsRateLimitingEnabled(_configuration) && !await _rateLimiter.IsRequestAllowedAsync(userId))
        {
            throw new QuotaExceededException($"Rate limit exceeded for user {userId}");
        }

        try
        {
            // Using the new Places API for place details
            var url = $"https://places.googleapis.com/v1/places/{placeId}";
            _logger?.LogDebug("Getting place details for place ID: {PlaceId}", placeId);

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("X-Goog-Api-Key", _apiKey);
            request.Headers.Add("X-Goog-FieldMask", "id,displayName,formattedAddress,addressComponents,location");
            
            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                _logger?.LogError("Google Places API error for place details: {Status} - {Content}", response.StatusCode, responseContent);
                throw new HttpRequestException($"Response status code does not indicate success: {response.StatusCode} ({response.ReasonPhrase})");
            }

            var place = JsonSerializer.Deserialize<PlaceDetailsResult>(responseContent);

            if (place == null) 
            {
                _logger?.LogInformation("No place details returned for place ID: {PlaceId}", placeId);
                return null;
            }

            var result = new PlaceDetails
            {
                PlaceId = place.Id,
                Name = place.DisplayName?.Text,
                FormattedAddress = place.FormattedAddress,
                AddressComponents = place.AddressComponents?.Select(ac => new GoogleAddressComponent
                {
                    LongText = ac.LongText ?? "",
                    ShortText = ac.ShortText ?? "",
                    Types = ac.Types ?? new List<string>()
                }).ToList(),
                Geometry = place.Location != null ? new GeometryInfo
                {
                    Location = new LocationInfo
                    {
                        Lat = place.Location.Latitude,
                        Lng = place.Location.Longitude
                    }
                } : null
            };

            _logger?.LogDebug("Successfully retrieved place details for: {PlaceName}", result.Name);
            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger?.LogError(ex, "HTTP error calling Google Places API for place details: {Message}", ex.Message);
            throw new Exception($"Error calling Google Places API: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Unexpected error calling Google Places API for place details: {Message}", ex.Message);
            throw new Exception($"Unexpected error calling Google Places API: {ex.Message}", ex);
        }
    }
}

// New Places API (v1) Response Models

internal class PlacesSearchTextResponse
{
    [JsonPropertyName("places")]
    public List<PlaceResult>? Places { get; set; }
}

internal class PlaceResult
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }
    
    [JsonPropertyName("displayName")]
    public LocalizedText? DisplayName { get; set; }
    
    [JsonPropertyName("formattedAddress")]
    public string? FormattedAddress { get; set; }
    
    [JsonPropertyName("types")]
    public List<string>? Types { get; set; }
}

internal class PlaceDetailsResult
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }
    
    [JsonPropertyName("displayName")]
    public LocalizedText? DisplayName { get; set; }
    
    [JsonPropertyName("formattedAddress")]
    public string? FormattedAddress { get; set; }
    
    [JsonPropertyName("addressComponents")]
    public List<AddressComponent>? AddressComponents { get; set; }
    
    [JsonPropertyName("location")]
    public LatLngLiteral? Location { get; set; }
}

internal class LocalizedText
{
    [JsonPropertyName("text")]
    public string? Text { get; set; }
    
    [JsonPropertyName("languageCode")]
    public string? LanguageCode { get; set; }
}

internal class AddressComponent
{
    [JsonPropertyName("longText")]
    public string? LongText { get; set; }
    
    [JsonPropertyName("shortText")]
    public string? ShortText { get; set; }
    
    [JsonPropertyName("types")]
    public List<string>? Types { get; set; }
}

internal class LatLngLiteral
{
    [JsonPropertyName("latitude")]
    public double Latitude { get; set; }
    
    [JsonPropertyName("longitude")]
    public double Longitude { get; set; }
}
