using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;

namespace GigRaptorService.Helpers;

public static class TokenEncryptionHelper
{
    // Encrypts the token using AES-GCM
    public static string Encrypt(string token, string base64Key)
    {
        var key = Convert.FromBase64String(base64Key);
        using var aes = new AesGcm(key);

        var nonce = RandomNumberGenerator.GetBytes(12); // 12 bytes for GCM
        var plaintext = System.Text.Encoding.UTF8.GetBytes(token);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[16];

        aes.Encrypt(nonce, plaintext, ciphertext, tag);

        // Combine nonce + tag + ciphertext for storage
        var combined = new byte[nonce.Length + tag.Length + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, combined, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, combined, nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, combined, nonce.Length + tag.Length, ciphertext.Length);

        return Convert.ToBase64String(combined);
    }

    // Decrypts the token using AES-GCM
    public static string Decrypt(string encryptedToken, string base64Key)
    {
        var key = Convert.FromBase64String(base64Key);
        var combined = Convert.FromBase64String(encryptedToken);

        var nonce = new byte[12];
        var tag = new byte[16];
        var ciphertext = new byte[combined.Length - nonce.Length - tag.Length];

        Buffer.BlockCopy(combined, 0, nonce, 0, nonce.Length);
        Buffer.BlockCopy(combined, nonce.Length, tag, 0, tag.Length);
        Buffer.BlockCopy(combined, nonce.Length + tag.Length, ciphertext, 0, ciphertext.Length);

        using var aes = new AesGcm(key);
        var plaintext = new byte[ciphertext.Length];
        aes.Decrypt(nonce, ciphertext, tag, plaintext);

        return System.Text.Encoding.UTF8.GetString(plaintext);
    }
}
