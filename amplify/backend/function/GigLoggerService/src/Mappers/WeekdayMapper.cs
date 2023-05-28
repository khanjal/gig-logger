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

            if (value.Count < headers.Count) {
                continue;
            }

            WeekdayEntity weekday = new()
            {
                Id = id,
                Day = value[HeaderParser.GetHeaderKey(headers, "Day")].ToString(),
                Miles = value[HeaderParser.GetHeaderKey(headers, "Miles")].ToString(),
                Trips = value[HeaderParser.GetHeaderKey(headers, "Trips")].ToString(),
                Pay = value[HeaderParser.GetHeaderKey(headers, "Pay")].ToString(),
                Tip = value[HeaderParser.GetHeaderKey(headers, "Tip")].ToString(),
                Bonus = value[HeaderParser.GetHeaderKey(headers, "Bonus")].ToString(),
                Total = value[HeaderParser.GetHeaderKey(headers, "Total")].ToString(),
                Cash = value[HeaderParser.GetHeaderKey(headers, "Cash")].ToString(),
                Time = value[HeaderParser.GetHeaderKey(headers, "Time")].ToString(),
                Days = value[HeaderParser.GetHeaderKey(headers, "Days")].ToString(),
                DailyAverage = value[HeaderParser.GetHeaderKey(headers, "$/Day")].ToString(),
                PreviousDailyAverage = value[HeaderParser.GetHeaderKey(headers, "$/Prev")].ToString(),
                CurrentAmount = value[HeaderParser.GetHeaderKey(headers, "Curr Amt")].ToString(),
                PreviousAmount = value[HeaderParser.GetHeaderKey(headers, "Prev Amt")].ToString(),
            };
            
            weekdays.Add(weekday);
        }
        return weekdays;
    }
}