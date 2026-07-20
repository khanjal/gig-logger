using System.Text.Json.Serialization;

namespace GigRaptorService.Models;

/// <summary>
/// Response model that either contains the sheet data directly or provides a link to S3 for large responses
/// </summary>
public class SheetResponse
{
    /// <summary>
    /// Direct sheet data (null if S3Link is provided). Declared as <see cref="object"/> rather than
    /// SheetEntity so the size-checked read path (see SheetManager.ProcessResponseSize) can hand over
    /// an already-serialized System.Text.Json.Nodes.JsonNode instead of the typed SheetEntity - System.Text.Json
    /// writes a JsonNode by copying its existing token tree, which is far cheaper than reflecting over the
    /// full SheetEntity object graph a second time. Small, non-size-checked responses (CreateSheet, SaveData)
    /// still pass a plain SheetEntity here, which serializes the normal (reflection-based) way.
    /// </summary>
    [JsonPropertyName("sheetEntity")]
    public object? SheetEntity { get; set; }

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
    /// Creates a SheetResponse with direct sheet data. Accepts either a typed SheetEntity (small
    /// responses that don't go through the size check) or an already-serialized JsonNode (the
    /// size-checked path, to avoid a second full-object serialization).
    /// </summary>
    public static SheetResponse FromSheetEntity(object sheetEntity)
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