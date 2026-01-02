using GigRaptorService.Models;
using Xunit;

namespace GigRaptorService.Tests.Models;

public class SheetHeadersTests
{
    [Fact]
    public void SheetHeaders_CanSetAndGetSheetId()
    {
        // Arrange
        var headers = new SheetHeaders();
        var expectedSheetId = "sheet-123";

        // Act
        headers.SheetId = expectedSheetId;

        // Assert
        Assert.Equal(expectedSheetId, headers.SheetId);
    }

    [Fact]
    public void SheetHeaders_CanSetAndGetAuthorization()
    {
        // Arrange
        var headers = new SheetHeaders();
        var expectedAuth = "Bearer token123";

        // Act
        headers.Authorization = expectedAuth;

        // Assert
        Assert.Equal(expectedAuth, headers.Authorization);
    }

    [Fact]
    public void SheetHeaders_DefaultsToNull()
    {
        // Arrange & Act
        var headers = new SheetHeaders();

        // Assert
        Assert.Null(headers.SheetId);
        Assert.Null(headers.Authorization);
    }

    [Fact]
    public void SheetHeaders_CanSetBothProperties()
    {
        // Arrange
        var headers = new SheetHeaders
        {
            SheetId = "sheet-456",
            Authorization = "Bearer xyz"
        };

        // Assert
        Assert.Equal("sheet-456", headers.SheetId);
        Assert.Equal("Bearer xyz", headers.Authorization);
    }
}
