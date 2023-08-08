using System.Linq;

public static class ObjectExtensions
{
    public static string GetColumn(this SheetModel sheet, HeaderEnum header)
    {
        return $"{sheet.Headers.FirstOrDefault(x => x.Name == header.DisplayName()).Column}";
    }

    public static string GetRange(this SheetModel sheet, HeaderEnum header, int row = 1)
    {
        var column = GetColumn(sheet, header);
        return $"{sheet.Name}!{column}{row}:{column}";
    }

    public static string GetLocalRange(this SheetModel sheet, HeaderEnum header, int row = 1)
    {
        var column = GetColumn(sheet, header);
        return $"{column}{row}:{column}";
    }
}