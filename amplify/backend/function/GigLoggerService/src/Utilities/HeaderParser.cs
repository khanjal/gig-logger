using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

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
        try
        {
            return header.First(x => x.Value.Trim() == value.Trim()).Key;
        }
        catch (System.Exception)
        {
            return -1;
        }
        
    }

    public static string GetStringValue(string columnName, IList<object> values, Dictionary<int, string> headers) {
        var columnId = GetHeaderKey(headers, columnName);

        if (columnId > values.Count || columnId < 0) {
            return "";
        }

        return values[columnId].ToString().Trim();
    }

    public static int GetIntValue(string columnName, IList<object> values, Dictionary<int, string> headers) {
        var columnId = GetHeaderKey(headers, columnName);

        if (columnId > values.Count || columnId < 0) {
            return 0;
        }

        var value = values[columnId].ToString().Trim();
        value = Regex.Replace(value, @"[^\d]", ""); // Remove all special symbols.
        if (value == "") { 
            return 0; // Make empty into 0s.
        } 

        int.TryParse(value, out int result);

        return result;
    }

    public static decimal GetDecimalValue(string columnName, IList<object> values, Dictionary<int, string> headers) {
        var columnId = GetHeaderKey(headers, columnName);

        if (columnId > values.Count || columnId < 0) {
            return 0;
        }

        var value = values[columnId].ToString().Trim();
        value = Regex.Replace(value, @"[^\d.-]", ""); // Remove all special currency symbols except for .'s and -'s
        if (value == "-" || value == "") { 
            value = "0";  // Make account -'s into 0s.
        }
        // Console.WriteLine(columnName);
        // Console.WriteLine(value);

        decimal.TryParse(value, out decimal result);

        return result;
    }
}