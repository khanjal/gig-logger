using RaptorSheets.Core.Entities;
using RaptorSheets.Core.Managers;

namespace GigRaptorService.Business;

public interface IFileManager
{
    public Task<PropertyEntity> CreateSheet(string name);
    public Task<List<PropertyEntity>> ListSheets();
}
public class FileManager : IFileManager
{
    private readonly IGoogleFileManager _googleFileManager;

    public FileManager(string token)
    {
        _googleFileManager = new GoogleFileManager(token);
    }

    public async Task<PropertyEntity> CreateSheet(string name)
    {
        // Create a new Google Sheet with the specified name
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Sheet name cannot be null or empty.", nameof(name));
        }
        var sheet = await _googleFileManager.CreateFile(name);

        // Log name
        Console.WriteLine($"Created sheet with name: {sheet.Name} and ID: {sheet.Id}");

        return sheet;
    }

    public async Task<List<PropertyEntity>> ListSheets()
    {
        var sheets = await _googleFileManager.GetFiles();

        return sheets;
    }

}