using System.Collections.Generic;

public static class ShiftsMapper
{
    public static List<ShiftEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var shifts = new List<ShiftEntity>();
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

            ShiftEntity shift = new()
            {
                Id = id,
                Key = value[HeaderParser.GetHeaderKey(headers, "Key")].ToString(),
                Date = value[HeaderParser.GetHeaderKey(headers, "Date")].ToString(),
                Start = value[HeaderParser.GetHeaderKey(headers, "Start")].ToString(),
                End = value[HeaderParser.GetHeaderKey(headers, "End")].ToString(),
                Service = value[HeaderParser.GetHeaderKey(headers, "Service")].ToString(),
                Number = value[HeaderParser.GetHeaderKey(headers, "#")].ToString(),
                Active = value[HeaderParser.GetHeaderKey(headers, "Active")].ToString(),
                Time = value[HeaderParser.GetHeaderKey(headers, "Time")].ToString(),
                Omit = value[HeaderParser.GetHeaderKey(headers, "O")].ToString(),
                Note = value[HeaderParser.GetHeaderKey(headers, "Note")].ToString(),
            };
            
            shifts.Add(shift);
        }
        return shifts;
    }
    public static IList<IList<object>> MapToRangeData(ShiftEntity shift)
    {
        var objectList = new List<object>() { 
            shift.Date,
            shift.Start,
            shift.End,
            shift.Service, 
            shift.Number,
            shift.Active,
            shift.Time,
            shift.Omit,
            "",
            "",
            "",
            "",
            "",
            "",
            shift.Note
        };

        var rangeData = new List<IList<object>> { objectList };
        return rangeData;
    }
}