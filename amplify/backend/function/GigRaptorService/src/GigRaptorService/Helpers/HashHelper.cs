using System.Security.Cryptography;
using System.Text;

namespace GigRaptorService.Helpers;

public static class HashHelper
{
    public static string HashId(string id)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(id));
        return Convert.ToHexString(hashedBytes)[..8]; // Take first 8 characters for brevity
    }
}
