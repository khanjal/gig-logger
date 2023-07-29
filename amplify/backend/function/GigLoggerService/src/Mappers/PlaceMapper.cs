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
                Place = HeaderParser.GetStringValue(HeaderEnum.PLACE.DisplayName(), value, headers),
                Trips = HeaderParser.GetIntValue(HeaderEnum.TRIPS.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.PAY.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.TIP.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.BONUS.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.CASH.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.DISTANCE.DisplayName(), value, headers),
            };
            
            places.Add(place);
        }

        return places;
    }
}