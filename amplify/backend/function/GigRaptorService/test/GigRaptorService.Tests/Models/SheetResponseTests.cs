using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Nodes;
using GigRaptorService.Models;
using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;
using Xunit;

namespace GigRaptorService.Tests.Models;

/// <summary>
/// SheetResponse.SheetEntity is declared as `object` (rather than the typed SheetEntity) so
/// SheetManager.ProcessResponseSize can hand over an already-serialized JsonNode instead of
/// re-serializing the full SheetEntity object graph a second time. These tests verify that
/// optimization is wire-shape neutral: whichever value flows through the property, the resulting
/// JSON must be identical to what the old, always-typed path produced.
/// </summary>
public class SheetResponseTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private static SheetEntity BuildSampleEntity()
    {
        return new SheetEntity
        {
            Properties = new PropertyEntity { Name = "TestSpreadsheet" },
            Sheets = new GigSheets
            {
                Trips = new List<TripEntity>
                {
                    new() { RowId = 2, Number = 1, Pay = 12.5m }
                }
            },
            Messages = new List<MessageEntity>
            {
                new() { Level = "INFO", Message = "Retrieved sheet(s): Trips" }
            }
        };
    }

    [Fact]
    public void FromSheetEntity_WithJsonNode_ProducesIdenticalJsonToTypedEntity()
    {
        // Arrange
        var entity = BuildSampleEntity();

        // Act - the "old" path: wrap the typed entity directly
        var typedResponse = SheetResponse.FromSheetEntity(entity);
        var typedJson = JsonSerializer.Serialize(typedResponse, Options);

        // Act - the "new" path: pre-serialize once (as ProcessResponseSize does for the size
        // check), parse into a JsonNode, and wrap that instead
        var preSerialized = JsonSerializer.Serialize(entity, Options);
        var node = JsonNode.Parse(preSerialized);
        var nodeResponse = SheetResponse.FromSheetEntity(node!);
        var nodeJson = JsonSerializer.Serialize(nodeResponse, Options);

        // Assert - byte-for-byte identical wire output regardless of which path built it
        Assert.Equal(typedJson, nodeJson);
    }

    [Fact]
    public void FromSheetEntity_WithJsonNode_SetsIsStoredInS3False()
    {
        // Arrange
        var node = JsonNode.Parse("{}");

        // Act
        var response = SheetResponse.FromSheetEntity(node!);

        // Assert
        Assert.False(response.IsStoredInS3);
        Assert.Null(response.S3Link);
        Assert.NotNull(response.SheetEntity);
    }

    [Fact]
    public void FromSheetEntity_JsonNodePath_PreservesNestedArraysAndValues()
    {
        // Arrange
        var entity = BuildSampleEntity();
        var preSerialized = JsonSerializer.Serialize(entity, Options);
        var node = JsonNode.Parse(preSerialized);

        // Act
        var response = SheetResponse.FromSheetEntity(node!);
        var json = JsonSerializer.Serialize(response, Options);
        using var parsed = JsonDocument.Parse(json);

        // Assert - spot-check the nested shape survived the JsonNode round trip
        var sheetEntityElement = parsed.RootElement.GetProperty("sheetEntity");
        var trips = sheetEntityElement.GetProperty("sheets").GetProperty("trips");
        Assert.Equal(1, trips.GetArrayLength());
        Assert.Equal(1, trips[0].GetProperty("number").GetInt32());
        Assert.Equal("TestSpreadsheet", sheetEntityElement.GetProperty("properties").GetProperty("name").GetString());
    }

    [Fact]
    public void FromS3Link_ShouldNotSetSheetEntity()
    {
        // Act
        var response = SheetResponse.FromS3Link("https://example-bucket.s3.amazonaws.com/key", new Dictionary<string, string> { { "sheetId", "abc" } });

        // Assert
        Assert.True(response.IsStoredInS3);
        Assert.Null(response.SheetEntity);
        Assert.Equal("https://example-bucket.s3.amazonaws.com/key", response.S3Link);
        Assert.Equal("abc", response.Metadata?["sheetId"]);
    }
}
