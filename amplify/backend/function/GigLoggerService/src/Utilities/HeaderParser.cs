using System.Collections.Generic;
using System.Linq;

public static class HeaderParser {
    public static Dictionary<int, string> ParserHeader(IList<object> sheetHeader) {
        var headerValues = new Dictionary<int, string>();

        foreach (var item in sheetHeader.Select((value, index) => new {index, value}))
        {
            headerValues.Add(item.index, item.value.ToString().Trim());
        }

        // Console.Write(JsonSerializer.Serialize(headerValues));

        return headerValues;
    }

    public static int GetHeaderKey(Dictionary<int, string> header, string value) {
        return header.FirstOrDefault(x => x.Value.Trim() == value.Trim()).Key;
    }

    public static string GetValue(string columnName, IList<object> values, Dictionary<int, string> headers) {
        var columnId = GetHeaderKey(headers, columnName);

        if (columnId > values.Count) {
            return "";
        }

        return values[columnId].ToString().Trim();
    }
}