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
                Key = HeaderParser.GetStringValue("Key", value, headers),
                Date = HeaderParser.GetStringValue("Date", value, headers),
                Start = HeaderParser.GetStringValue("Start", value, headers),
                End = HeaderParser.GetStringValue("End", value, headers),
                Service = HeaderParser.GetStringValue("Service", value, headers),
                Number = HeaderParser.GetIntValue("#", value, headers),
                Active = HeaderParser.GetStringValue("T Active", value, headers),
                Time = HeaderParser.GetStringValue("T Time", value, headers),
                Trips = HeaderParser.GetIntValue("T Trip", value, headers),
                Omit = HeaderParser.GetStringValue("O", value, headers),
                Note = HeaderParser.GetStringValue("Note", value, headers),
                Pay = HeaderParser.GetDecimalValue("T Pay", value, headers),
                Tip = HeaderParser.GetDecimalValue("T Tip", value, headers),
                Bonus = HeaderParser.GetDecimalValue("T Bonus", value, headers),
                Total = HeaderParser.GetDecimalValue("G Total", value, headers),
                Cash = HeaderParser.GetDecimalValue("T Cash", value, headers),
                Saved = true
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
                switch (header.ToString().Trim())
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
                    case "#":
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