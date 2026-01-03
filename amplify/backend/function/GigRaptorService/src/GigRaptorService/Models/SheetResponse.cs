using RaptorSheets.Gig.Entities;
using System.Text.Json.Serialization;

namespace GigRaptorService.Models;

/// <summary>
/// Response model that either contains the sheet data directly or provides a link to S3 for large responses
/// </summary>
public class SheetResponse
{
    /// <summary>
    /// Direct sheet data (null if S3Link is provided)
    /// </summary>
    [JsonPropertyName("sheetEntity")]
    public SheetEntity? SheetEntity { get; set; }

    /// <summary>
    /// S3 link for large responses (null if SheetEntity is provided)
    /// </summary>
    [JsonPropertyName("s3Link")]
    public string? S3Link { get; set; }

    /// <summary>
    /// Indicates whether the response was too large and stored in S3
    /// </summary>
    [JsonPropertyName("isStoredInS3")]
    public bool IsStoredInS3 { get; set; }

    /// <summary>
    /// Optional metadata about the response
    /// </summary>
    [JsonPropertyName("metadata")]
    public Dictionary<string, string>? Metadata { get; set; }

    /// <summary>
    /// Creates a SheetResponse with direct sheet data
    /// </summary>
    public static SheetResponse FromSheetEntity(SheetEntity sheetEntity)
    {
        return new SheetResponse
        {
            SheetEntity = sheetEntity,
            IsStoredInS3 = false
        };
    }

    /// <summary>
    /// Creates a SheetResponse with an S3 link
    /// </summary>
    public static SheetResponse FromS3Link(string s3Link, Dictionary<string, string>? metadata = null)
    {
        return new SheetResponse
        {
            S3Link = s3Link,
            IsStoredInS3 = true,
            Metadata = metadata
        };
    }
}