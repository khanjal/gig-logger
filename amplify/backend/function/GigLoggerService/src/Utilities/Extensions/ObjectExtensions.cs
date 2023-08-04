using System.Linq;

public static class ObjectExtensions
{
    public static string GetRange(this SheetModel sheet, HeaderEnum header)
    {
        return $"{sheet.Name}!{sheet.Headers.FirstOrDefault(x => x.Name == header.DisplayName()).Range}";
    }
}