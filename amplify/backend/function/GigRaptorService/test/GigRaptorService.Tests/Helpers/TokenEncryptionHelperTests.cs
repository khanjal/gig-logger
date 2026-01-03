using GigRaptorService.Helpers;
using System.Security.Cryptography;
using Xunit;

namespace GigRaptorService.Tests.Helpers;

public class TokenEncryptionHelperTests
{
    private readonly string _testKey;

    public TokenEncryptionHelperTests()
    {
        // Generate a valid 256-bit key for testing
        var key = new byte[32];
        RandomNumberGenerator.Fill(key);
        _testKey = Convert.ToBase64String(key);
    }

    [Fact]
    public void Encrypt_ThenDecrypt_ReturnsOriginalToken()
    {
        // Arrange
        var originalToken = "test-token-12345";

        // Act
        var encrypted = TokenEncryptionHelper.Encrypt(originalToken, _testKey);
        var decrypted = TokenEncryptionHelper.Decrypt(encrypted, _testKey);

        // Assert
        Assert.Equal(originalToken, decrypted);
    }

    [Fact]
    public void Encrypt_SameTokenTwice_ReturnsDifferentCiphertext()
    {
        // Arrange
        var token = "test-token";

        // Act
        var encrypted1 = TokenEncryptionHelper.Encrypt(token, _testKey);
        var encrypted2 = TokenEncryptionHelper.Encrypt(token, _testKey);

        // Assert
        Assert.NotEqual(encrypted1, encrypted2); // Different nonces should produce different ciphertext
    }

    [Fact]
    public void Encrypt_WithLongToken_Works()
    {
        // Arrange
        var longToken = new string('a', 1000);

        // Act
        var encrypted = TokenEncryptionHelper.Encrypt(longToken, _testKey);
        var decrypted = TokenEncryptionHelper.Decrypt(encrypted, _testKey);

        // Assert
        Assert.Equal(longToken, decrypted);
    }

    [Fact]
    public void Encrypt_WithEmptyString_Works()
    {
        // Arrange
        var emptyToken = "";

        // Act
        var encrypted = TokenEncryptionHelper.Encrypt(emptyToken, _testKey);
        var decrypted = TokenEncryptionHelper.Decrypt(encrypted, _testKey);

        // Assert
        Assert.Equal(emptyToken, decrypted);
    }

    [Fact]
    public void Encrypt_WithSpecialCharacters_Works()
    {
        // Arrange
        var token = "token!@#$%^&*()_+-=[]{}|;':\",./<>?";

        // Act
        var encrypted = TokenEncryptionHelper.Encrypt(token, _testKey);
        var decrypted = TokenEncryptionHelper.Decrypt(encrypted, _testKey);

        // Assert
        Assert.Equal(token, decrypted);
    }

    [Fact]
    public void Decrypt_WithWrongKey_ThrowsException()
    {
        // Arrange
        var token = "test-token";
        var encrypted = TokenEncryptionHelper.Encrypt(token, _testKey);
        
        // Generate a different key
        var wrongKey = new byte[32];
        RandomNumberGenerator.Fill(wrongKey);
        var wrongKeyBase64 = Convert.ToBase64String(wrongKey);

        // Act & Assert
        Assert.ThrowsAny<Exception>(() => 
            TokenEncryptionHelper.Decrypt(encrypted, wrongKeyBase64));
    }

    [Fact]
    public void Decrypt_WithInvalidBase64_ThrowsException()
    {
        // Arrange
        var invalidEncrypted = "not-valid-base64!@#$";

        // Act & Assert
        Assert.ThrowsAny<Exception>(() => 
            TokenEncryptionHelper.Decrypt(invalidEncrypted, _testKey));
    }
}
