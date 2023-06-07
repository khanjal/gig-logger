using System.Collections.Generic;

public static class PlaceMapper
{
    public static List<PlaceEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var places = new List<PlaceEntity>();
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

            PlaceEntity place = new()
            {
                Id = id,
                Place = HeaderParser.GetStringValue("Place", value, headers),
                Trips = HeaderParser.GetStringValue("Trips", value, headers),
                Pay = HeaderParser.GetDecimalValue("Pay", value, headers),
                Tip = HeaderParser.GetDecimalValue("Tip", value, headers),
                Bonus = HeaderParser.GetDecimalValue("Bonus", value, headers),
                Total = HeaderParser.GetDecimalValue("Total", value, headers),
                Cash = HeaderParser.GetDecimalValue("Cash", value, headers),
                Miles = HeaderParser.GetStringValue("Miles", value, headers),
            };
            
            places.Add(place);
        }

        return places;
    }
}