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

            if (value[0].ToString() == "") {
                continue;
            }

            ShiftEntity shift = new()
            {
                Id = id,
                Key = HeaderParser.GetValue("Key", value, headers),
                Date = HeaderParser.GetValue("Date", value, headers),
                Start = HeaderParser.GetValue("Start", value, headers),
                End = HeaderParser.GetValue("End", value, headers),
                Service = HeaderParser.GetValue("Service", value, headers),
                Number = HeaderParser.GetValue("#", value, headers),
                Active = HeaderParser.GetValue("Active", value, headers),
                Time = HeaderParser.GetValue("Time", value, headers),
                Omit = HeaderParser.GetValue("O", value, headers),
                Note = HeaderParser.GetValue("Note", value, headers),
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