using System.Text.Json;
using System.Text.Json.Serialization;
using GigRaptorService.Business;
using GigRaptorService.Helpers;
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

    public GooglePlacesService(HttpClient httpClient, IConfiguration configuration, DynamoDbRateLimiter rateLimiter)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _rateLimiter = rateLimiter;
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

            // Build request body for the new Places API Text Search
            // Note: For text search, we don't use includedType - it's more flexible without it
            
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
            Console.WriteLine($"[GooglePlaces] Request URL: {url}");
            Console.WriteLine($"[GooglePlaces] Request Body: {requestJson}");
            Console.WriteLine($"[GooglePlaces] API Key (first 10 chars): {(_apiKey != null ? _apiKey.Substring(0, Math.Min(10, _apiKey.Length)) : "null")}...");

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
            
            Console.WriteLine($"[GooglePlaces] Request Headers: X-Goog-Api-Key={(_apiKey != null ? _apiKey.Substring(0, Math.Min(10, _apiKey.Length)) : "null")}..., X-Goog-FieldMask=places.id,places.displayName,places.formattedAddress,places.types");
            
            var response = await _httpClient.SendAsync(request);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[GooglePlaces] Response Status: {response.StatusCode}");
            Console.WriteLine($"[GooglePlaces] Response Headers: {string.Join(", ", response.Headers.Select(h => $"{h.Key}={string.Join(";", h.Value)}"))}");
            Console.WriteLine($"[GooglePlaces] Response Body: {responseContent}");
            
            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"Response status code does not indicate success: {response.StatusCode} ({response.ReasonPhrase}). Response: {responseContent}");
            }

            var googleResponse = JsonSerializer.Deserialize<PlacesSearchTextResponse>(responseContent);

            if (googleResponse?.Places == null)
            {
                Console.WriteLine("[GooglePlaces] No places returned in response");
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

            Console.WriteLine($"[GooglePlaces] Successfully returned {results.Count} results");
            return results;
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"[GooglePlaces] Autocomplete HTTP Request Exception: {ex.Message}");
            Console.WriteLine($"[GooglePlaces] Autocomplete Exception Details: {ex}");
            throw new Exception($"Error calling Google Places API: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GooglePlaces] Autocomplete General Exception: {ex.Message}");
            Console.WriteLine($"[GooglePlaces] Autocomplete Exception Details: {ex}");
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

            Console.WriteLine($"[GooglePlaces] Place Details URL: {url}");
            Console.WriteLine($"[GooglePlaces] Place ID: {placeId}");

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("X-Goog-Api-Key", _apiKey);
            request.Headers.Add("X-Goog-FieldMask", "id,displayName,formattedAddress,addressComponents,location");
            
            Console.WriteLine($"[GooglePlaces] Place Details Headers: X-Goog-Api-Key={(_apiKey != null ? _apiKey.Substring(0, Math.Min(10, _apiKey.Length)) : "null")}..., X-Goog-FieldMask=id,displayName,formattedAddress,addressComponents,location");
            
            var response = await _httpClient.SendAsync(request);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[GooglePlaces] Place Details Response Status: {response.StatusCode}");
            Console.WriteLine($"[GooglePlaces] Place Details Response Body: {responseContent}");
            
            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"Response status code does not indicate success: {response.StatusCode} ({response.ReasonPhrase}). Response: {responseContent}");
            }

            var place = JsonSerializer.Deserialize<PlaceDetailsResult>(responseContent);

            if (place == null) 
            {
                Console.WriteLine("[GooglePlaces] No place details returned");
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

            Console.WriteLine($"[GooglePlaces] Successfully returned place details for {result.Name}");
            return result;
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"[GooglePlaces] Place Details HTTP Request Exception: {ex.Message}");
            Console.WriteLine($"[GooglePlaces] Place Details Exception Details: {ex}");
            throw new Exception($"Error calling Google Places API: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GooglePlaces] Place Details General Exception: {ex.Message}");
            Console.WriteLine($"[GooglePlaces] Place Details Exception Details: {ex}");
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
