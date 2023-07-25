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
                Name = HeaderParser.GetStringValue(HeaderEnum.Name.DisplayName(), value, headers),
                Visits = HeaderParser.GetIntValue(HeaderEnum.Visits.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.Pay.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.Tip.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.Bonus.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.Total.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.Cash.DisplayName(), value, headers),
                Distance = HeaderParser.GetIntValue(HeaderEnum.Distance.DisplayName(), value, headers),
            };
            
            names.Add(name);
        }
        return names;
    }
}