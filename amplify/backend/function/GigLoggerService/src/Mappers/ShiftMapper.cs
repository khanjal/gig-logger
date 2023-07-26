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
                Key = HeaderParser.GetStringValue(HeaderEnum.Key.DisplayName(), value, headers),
                Date = HeaderParser.GetStringValue(HeaderEnum.Date.DisplayName(), value, headers),
                Start = HeaderParser.GetStringValue(HeaderEnum.TimeStart.DisplayName(), value, headers),
                End = HeaderParser.GetStringValue(HeaderEnum.TimeEnd.DisplayName(), value, headers),
                Service = HeaderParser.GetStringValue(HeaderEnum.Service.DisplayName(), value, headers),
                Number = HeaderParser.GetIntValue(HeaderEnum.Number.DisplayName(), value, headers),
                Active = HeaderParser.GetStringValue(HeaderEnum.TotalTimeActive.DisplayName(), value, headers),
                Time = HeaderParser.GetStringValue(HeaderEnum.TotalTime.DisplayName(), value, headers),
                Trips = HeaderParser.GetIntValue(HeaderEnum.Trips.DisplayName(), value, headers),
                Omit = HeaderParser.GetStringValue(HeaderEnum.TimeOmit.DisplayName(), value, headers),
                Region = HeaderParser.GetStringValue(HeaderEnum.Region.DisplayName(), value, headers),
                Note = HeaderParser.GetStringValue(HeaderEnum.Note.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.TotalPay.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.TotalTips.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.TotalBonus.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.TotalGrand.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.TotalCash.DisplayName(), value, headers),
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
                var headerEnum = header.ToString().Trim().GetValueFromName<HeaderEnum>();

                switch (headerEnum)
                {
                    case HeaderEnum.Date:
                        objectList.Add(shift.Date);
                        break;
                    case HeaderEnum.TimeStart:
                        objectList.Add(shift.Start);
                        break;
                    case HeaderEnum.TimeEnd:
                        objectList.Add(shift.End);
                        break;
                    case HeaderEnum.Service:
                        objectList.Add(shift.Service);
                        break;
                    case HeaderEnum.Number:
                        objectList.Add(shift.Number);
                        break;
                    case HeaderEnum.TimeActive:
                        objectList.Add(shift.Active);
                        break;
                    case HeaderEnum.TimeTotal:
                        objectList.Add(shift.Time);
                        break;
                    case HeaderEnum.TimeOmit:
                        objectList.Add(shift.Omit);
                        break;
                    case HeaderEnum.Pay:
                        objectList.Add(shift.Pay);
                        break;
                    case HeaderEnum.Tips:
                        objectList.Add(shift.Tip);
                        break;
                    case HeaderEnum.Bonus:
                        objectList.Add(shift.Bonus);
                        break;
                    case HeaderEnum.Cash:
                        objectList.Add(shift.Cash);
                        break;
                    case HeaderEnum.Region:
                        objectList.Add(shift.Region);
                        break;
                    case HeaderEnum.Note:
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