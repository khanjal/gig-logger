using System.Collections.Generic;

public static class TypeMapper
{
    public static List<TypeEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var types = new List<TypeEntity>();
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

            TypeEntity type = new()
            {
                Id = id,
                Type = HeaderParser.GetStringValue("Type", value, headers),
                Trips = HeaderParser.GetIntValue("Trips", value, headers),
                Pay = HeaderParser.GetDecimalValue("Pay", value, headers),
                Tip = HeaderParser.GetDecimalValue("Tip", value, headers),
                Bonus = HeaderParser.GetDecimalValue("Bonus", value, headers),
                Total = HeaderParser.GetDecimalValue("Total", value, headers),
                Cash = HeaderParser.GetDecimalValue("Cash", value, headers),
                Miles = HeaderParser.GetDecimalValue("Miles", value, headers),
            };
            
            types.Add(type);
        }
        return types;
    }
}