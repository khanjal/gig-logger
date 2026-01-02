using GigRaptorService.Helpers;
using Xunit;

namespace GigRaptorService.Tests.Helpers;

public class HashHelperTests
{
    [Fact]
    public void HashId_WithValidInput_ReturnsConsistentHash()
    {
        // Arrange
        var input = "test-user-id-123";

        // Act
        var hash1 = HashHelper.HashId(input);
        var hash2 = HashHelper.HashId(input);

        // Assert
        Assert.Equal(hash1, hash2);
    }

    [Fact]
    public void HashId_WithDifferentInputs_ReturnsDifferentHashes()
    {
        // Arrange
        var input1 = "user-id-1";
        var input2 = "user-id-2";

        // Act
        var hash1 = HashHelper.HashId(input1);
        var hash2 = HashHelper.HashId(input2);

        // Assert
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void HashId_ReturnsEightCharacterString()
    {
        // Arrange
        var input = "test-input";

        // Act
        var hash = HashHelper.HashId(input);

        // Assert
        Assert.Equal(8, hash.Length);
    }

    [Fact]
    public void HashId_ReturnsHexString()
    {
        // Arrange
        var input = "test-input";

        // Act
        var hash = HashHelper.HashId(input);

        // Assert
        Assert.Matches("^[0-9A-F]{8}$", hash);
    }

    [Fact]
    public void HashId_WithEmptyString_ReturnsValidHash()
    {
        // Arrange
        var input = "";

        // Act
        var hash = HashHelper.HashId(input);

        // Assert
        Assert.Equal(8, hash.Length);
        Assert.Matches("^[0-9A-F]{8}$", hash);
    }
}
