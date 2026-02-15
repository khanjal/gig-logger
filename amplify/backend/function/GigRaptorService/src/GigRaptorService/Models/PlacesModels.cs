using System.Text.Json.Serialization;

namespace GigRaptorService.Models;

public class PlacesAutocompleteRequest
{
    [JsonPropertyName("query")]
    public string Query { get; set; } = string.Empty;
    
    [JsonPropertyName("searchType")]
    public string SearchType { get; set; } = "address";
    
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
    
    [JsonPropertyName("country")]
    public string Country { get; set; } = "US";
    
    [JsonPropertyName("userLatitude")]
    public double? UserLatitude { get; set; }
    
    [JsonPropertyName("userLongitude")]
    public double? UserLongitude { get; set; }
    
    [JsonPropertyName("radiusMeters")]
    public double? RadiusMeters { get; set; }
}

public class PlaceDetailsRequest
{
    [JsonPropertyName("placeId")]
    public string PlaceId { get; set; } = string.Empty;
    
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
}

public class SheetCreationRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class AutocompleteResult
{
    [JsonPropertyName("place")]
    public string Place { get; set; } = string.Empty;
    
    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;
    
    [JsonPropertyName("placeDetails")]
    public PlaceDetails? PlaceDetails { get; set; }
}

public class PlaceDetails
{
    [JsonPropertyName("placeId")]
    public string? PlaceId { get; set; }
    
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    
    [JsonPropertyName("formattedAddress")]
    public string? FormattedAddress { get; set; }
    
    [JsonPropertyName("addressComponents")]
    public List<GoogleAddressComponent>? AddressComponents { get; set; }
    
    [JsonPropertyName("geometry")]
    public GeometryInfo? Geometry { get; set; }
}

public class GoogleAddressComponent
{
    [JsonPropertyName("longText")]
    public string LongText { get; set; } = string.Empty;
    
    [JsonPropertyName("shortText")]
    public string ShortText { get; set; } = string.Empty;
    
    [JsonPropertyName("types")]
    public List<string> Types { get; set; } = new();
}

public class GeometryInfo
{
    [JsonPropertyName("location")]
    public LocationInfo Location { get; set; } = new();
}

public class LocationInfo
{
    [JsonPropertyName("lat")]
    public double Lat { get; set; }
    
    [JsonPropertyName("lng")]
    public double Lng { get; set; }
}

public class QuotaExceededException : Exception
{
    public QuotaExceededException() : base("API quota exceeded for user") { }
    public QuotaExceededException(string message) : base(message) { }
}

public class UserApiUsage
{
    public string UserId { get; set; } = string.Empty;
    public int MonthlyQuota { get; set; }
    public int CurrentUsage { get; set; }
    public string Tier { get; set; } = "Free";
    public DateTime LastRequestTime { get; set; }
}
