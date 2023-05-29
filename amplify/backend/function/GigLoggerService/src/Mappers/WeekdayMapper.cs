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

            WeekdayEntity weekday = new()
            {
                Id = id,
                Day = HeaderParser.GetValue("Day", value, headers),
                Miles = HeaderParser.GetValue("Miles", value, headers),
                Trips = HeaderParser.GetValue("Trips", value, headers),
                Pay = HeaderParser.GetValue("Pay", value, headers),
                Tip = HeaderParser.GetValue("Tip", value, headers),
                Bonus = HeaderParser.GetValue("Bonus", value, headers),
                Total = HeaderParser.GetValue("Total", value, headers),
                Cash = HeaderParser.GetValue("Cash", value, headers),
                Time = HeaderParser.GetValue("Time", value, headers),
                Days = HeaderParser.GetValue("Days", value, headers),
                DailyAverage = HeaderParser.GetValue("$/Day", value, headers),
                PreviousDailyAverage = HeaderParser.GetValue("$/Prev", value, headers),
                CurrentAmount = HeaderParser.GetValue("Curr Amt", value, headers),
                PreviousAmount = HeaderParser.GetValue("Prev Amt", value, headers),
            };
            
            weekdays.Add(weekday);
        }
        return weekdays;
    }
}