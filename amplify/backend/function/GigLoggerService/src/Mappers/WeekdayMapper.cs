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
                Day = HeaderParser.GetStringValue(HeaderEnum.DAY.DisplayName(), value, headers),
                Trips = HeaderParser.GetIntValue(HeaderEnum.TRIPS.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.PAY.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.TIP.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.BONUS.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.CASH.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.DISTANCE.DisplayName(), value, headers),
                Time = HeaderParser.GetStringValue(HeaderEnum.TIME_TOTAL.DisplayName(), value, headers),
                Days = HeaderParser.GetIntValue(HeaderEnum.DAYS.DisplayName(), value, headers),
                DailyAverage = HeaderParser.GetDecimalValue(HeaderEnum.AMOUNT_PER_DAY.DisplayName(), value, headers),
                PreviousDailyAverage = HeaderParser.GetDecimalValue(HeaderEnum.AMOUNT_PER_PREVIOUS_DAY.DisplayName(), value, headers),
                CurrentAmount = HeaderParser.GetDecimalValue(HeaderEnum.AMOUNT_CURRENT.DisplayName(), value, headers),
                PreviousAmount = HeaderParser.GetDecimalValue(HeaderEnum.AMOUNT_PREVIOUS.DisplayName(), value, headers),
            };
            
            weekdays.Add(weekday);
        }
        return weekdays;
    }

    public static SheetModel GetSheet() {
        var sheet = new SheetModel
        {
            Name = SheetEnum.WEEKDAYS.DisplayName(),
            TabColor = ColorEnum.LIGHT_GREEN,
            CellColor = ColorEnum.LIGHT_GRAY,
            FreezeColumnCount = 1,
            FreezeRowCount = 1,
            ProtectSheet = true
        };

        var dailySheet = DailyMapper.GetSheet();

        sheet.Headers = SheetHelper.GetCommonTripGroupSheetHeaders(dailySheet, HeaderEnum.DAY);

        return sheet;
    }
}