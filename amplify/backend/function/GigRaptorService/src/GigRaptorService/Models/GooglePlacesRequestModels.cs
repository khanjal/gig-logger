using System.Text.Json.Serialization;

namespace GigRaptorService.Models;

/// <summary>
/// Represents a location bias for Google Places API search requests.
/// Specifies an area to search where results around the specified location can be returned.
/// </summary>
public class LocationBias
{
    [JsonPropertyName("circle")]
    public Circle? Circle { get; set; }
}

/// <summary>
/// Represents a circular region defined by a center point and radius.
/// Used for location biasing in Google Places API requests.
/// </summary>
public class Circle
{
    [JsonPropertyName("center")]
    public LatLngLiteral? Center { get; set; }
    
    [JsonPropertyName("radius")]
    public double Radius { get; set; }
}
