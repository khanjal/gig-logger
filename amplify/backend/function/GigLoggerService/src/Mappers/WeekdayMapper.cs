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
                Day = HeaderParser.GetStringValue("Day", value, headers),
                Miles = HeaderParser.GetDecimalValue("Miles", value, headers),
                Trips = HeaderParser.GetIntValue("Trips", value, headers),
                Pay = HeaderParser.GetDecimalValue("Pay", value, headers),
                Tip = HeaderParser.GetDecimalValue("Tip", value, headers),
                Bonus = HeaderParser.GetDecimalValue("Bonus", value, headers),
                Total = HeaderParser.GetDecimalValue("Total", value, headers),
                Cash = HeaderParser.GetDecimalValue("Cash", value, headers),
                Time = HeaderParser.GetStringValue("Time", value, headers),
                Days = HeaderParser.GetIntValue("Days", value, headers),
                DailyAverage = HeaderParser.GetDecimalValue("$/Day", value, headers),
                PreviousDailyAverage = HeaderParser.GetDecimalValue("$/Prev", value, headers),
                CurrentAmount = HeaderParser.GetDecimalValue("Curr Amt", value, headers),
                PreviousAmount = HeaderParser.GetDecimalValue("Prev Amt", value, headers),
            };
            
            weekdays.Add(weekday);
        }
        return weekdays;
    }
}