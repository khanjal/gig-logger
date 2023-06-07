using System.Collections.Generic;

public static class NameMapper
{
    public static List<NameEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var names = new List<NameEntity>();
        var headers = new Dictionary<int, string>();
        var id = 0;

        foreach (var value in values)
        {
            id++;
            if (id == 1) {
                headers = HeaderParser.ParserHeader(value);
                continue;
            }

            if (value[0].ToString() == "") {
                continue;
            }

            NameEntity name = new()
            {
                Id = id,
                Name = HeaderParser.GetStringValue("Name", value, headers),
                Visits = HeaderParser.GetStringValue("Visits", value, headers),
                Pay = HeaderParser.GetDecimalValue("Pay", value, headers),
                Tip = HeaderParser.GetDecimalValue("Tip", value, headers),
                Bonus = HeaderParser.GetDecimalValue("Bonus", value, headers),
                Total = HeaderParser.GetDecimalValue("Total", value, headers),
                Cash = HeaderParser.GetDecimalValue("Cash", value, headers),
                Miles = HeaderParser.GetStringValue("Miles", value, headers),
            };
            
            names.Add(name);
        }
        return names;
    }
}