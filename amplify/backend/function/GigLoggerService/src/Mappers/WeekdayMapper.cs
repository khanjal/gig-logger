using System.Collections.Generic;

public static class WeekdayMapper
{
    public static List<WeekdayEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var weekdays = new List<WeekdayEntity>();
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

            // Console.Write(JsonSerializer.Serialize(value));
            WeekdayEntity weekday = new()
            {
                Id = id,
                Day = HeaderParser.GetStringValue(HeaderEnum.Day.DisplayName(), value, headers),
                Trips = HeaderParser.GetIntValue(HeaderEnum.Trips.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.Pay.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.Tip.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.Bonus.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.Total.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.Cash.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.Distance.DisplayName(), value, headers),
                Time = HeaderParser.GetStringValue(HeaderEnum.TimeTotal.DisplayName(), value, headers),
                Days = HeaderParser.GetIntValue(HeaderEnum.Days.DisplayName(), value, headers),
                DailyAverage = HeaderParser.GetDecimalValue(HeaderEnum.AmountPerDay.DisplayName(), value, headers),
                PreviousDailyAverage = HeaderParser.GetDecimalValue(HeaderEnum.AmountPerPreviousDay.DisplayName(), value, headers),
                CurrentAmount = HeaderParser.GetDecimalValue(HeaderEnum.AmountCurrent.DisplayName(), value, headers),
                PreviousAmount = HeaderParser.GetDecimalValue(HeaderEnum.AmountPrevious.DisplayName(), value, headers),
            };
            
            weekdays.Add(weekday);
        }
        return weekdays;
    }
}