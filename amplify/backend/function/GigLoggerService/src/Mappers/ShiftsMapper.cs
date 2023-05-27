using System.Collections.Generic;

public static class ShiftsMapper
{
    public static List<Shift> MapFromRangeData(IList<IList<object>> values)
    {
        var shifts = new List<Shift>();
        var id = 1;
        foreach (var value in values)
        {
            if (id == 1) {
                id++;
                continue;
            }

            Shift shift = new()
            {
                Id = id,
                Key = value[31].ToString(),
                Date = value[0].ToString(),
                Start = value[1].ToString(),
                End = value[2].ToString(),
                Service = value[3].ToString(),
                Number = value[4].ToString(),
                Active = value[5].ToString(),
                Time = value[6].ToString(),
                Omit = value[7].ToString(),
                Note = value[14].ToString(),
            };
            
            shifts.Add(shift);
            id++;
        }
        return shifts;
    }
    public static IList<IList<object>> MapToRangeData(Shift shift)
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