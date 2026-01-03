using GigRaptorService.Business;
using Xunit;

namespace GigRaptorService.Tests.Business;

public class FileManagerTests
{
    [Fact]
    public async Task CreateSheet_WithEmptyName_ThrowsArgumentException()
    {
        // Arrange
        var manager = new FileManager("test-token");

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            manager.CreateSheet(""));
    }

    [Fact]
    public async Task CreateSheet_WithNullName_ThrowsArgumentException()
    {
        // Arrange
        var manager = new FileManager("test-token");

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            manager.CreateSheet(null!));
    }

    [Fact]
    public async Task CreateSheet_WithWhitespaceName_ThrowsArgumentException()
    {
        // Arrange
        var manager = new FileManager("test-token");

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            manager.CreateSheet("   "));
    }
}
