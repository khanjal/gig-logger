using System.Security.Cryptography;
using System.Text;

namespace GigRaptorService.Helpers;

public static class HashHelper
{
    public static string HashSpreadsheetId(string spreadsheetId)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(spreadsheetId);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash); // Store as Base64 for readability
    }
}
