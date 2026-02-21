using System.Text.Json.Serialization;

namespace GigRaptorService.Models;

/// <summary>
/// Response from Google Places API Text Search endpoint.
/// </summary>
public class PlacesSearchTextResponse
{
    [JsonPropertyName("places")]
    public List<PlaceResult>? Places { get; set; }
}

/// <summary>
/// Represents a single place result from Google Places API search.
/// </summary>
public class PlaceResult
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

/// <summary>
/// Detailed information about a place from Google Places API.
/// </summary>
public class PlaceDetailsResult
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

/// <summary>
/// Localized text with language code.
/// </summary>
public class LocalizedText
{
    [JsonPropertyName("text")]
    public string? Text { get; set; }
    
    [JsonPropertyName("languageCode")]
    public string? LanguageCode { get; set; }
}

/// <summary>
/// A component of a structured address (e.g., city, state, postal code).
/// </summary>
public class AddressComponent
{
    [JsonPropertyName("longText")]
    public string? LongText { get; set; }
    
    [JsonPropertyName("shortText")]
    public string? ShortText { get; set; }
    
    [JsonPropertyName("types")]
    public List<string>? Types { get; set; }
}

/// <summary>
/// Latitude/longitude coordinate pair.
/// </summary>
public class LatLngLiteral
{
    [JsonPropertyName("latitude")]
    public double Latitude { get; set; }
    
    [JsonPropertyName("longitude")]
    public double Longitude { get; set; }
}
