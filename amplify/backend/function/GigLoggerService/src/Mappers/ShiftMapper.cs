using System.Collections.Generic;

public static class ShiftMapper
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
    public static IList<IList<object>> MapToRangeData(List<ShiftEntity> shifts, IList<object> shiftHeaders)
    {
        var rangeData = new List<IList<object>>();

        foreach (var shift in shifts)
        {
            var objectList = new List<object>();

            foreach (var header in shiftHeaders)
            {
                switch (header.ToString())
                {
                    case "Date":
                        objectList.Add(shift.Date);
                        break;
                    case "Start":
                        objectList.Add(shift.Start);
                        break;
                    case "End":
                        objectList.Add(shift.End);
                        break;
                    case "Service":
                        objectList.Add(shift.Service);
                        break;
                    case "Number":
                        objectList.Add(shift.Number);
                        break;
                    case "Active":
                        objectList.Add(shift.Active);
                        break;
                    case "Time":
                        objectList.Add(shift.Time);
                        break;
                    case "Omit":
                        objectList.Add(shift.Omit);
                        break;
                    case "Pay":
                        objectList.Add(shift.Pay);
                        break;
                    case "Tip":
                        objectList.Add(shift.Tip);
                        break;
                    case "Bonus":
                        objectList.Add(shift.Bonus);
                        break;
                    case "Cash":
                        objectList.Add(shift.Cash);
                        break;
                    case "Note":
                        objectList.Add(shift.Note);
                        break;
                    default:
                        objectList.Add(null);
                        break;
                }   
            }

            rangeData.Add(objectList);
        }
        
        return rangeData;
    }
}