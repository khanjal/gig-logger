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
                Key = HeaderParser.GetStringValue(HeaderEnum.KEY.DisplayName(), value, headers),
                Date = HeaderParser.GetStringValue(HeaderEnum.DATE.DisplayName(), value, headers),
                Start = HeaderParser.GetStringValue(HeaderEnum.TIME_START.DisplayName(), value, headers),
                End = HeaderParser.GetStringValue(HeaderEnum.TIME_END.DisplayName(), value, headers),
                Service = HeaderParser.GetStringValue(HeaderEnum.SERVICE.DisplayName(), value, headers),
                Number = HeaderParser.GetIntValue(HeaderEnum.NUMBER.DisplayName(), value, headers),
                Active = HeaderParser.GetStringValue(HeaderEnum.TOTAL_TIME_ACTIVE.DisplayName(), value, headers),
                Time = HeaderParser.GetStringValue(HeaderEnum.TOTAL_TIME.DisplayName(), value, headers),
                Trips = HeaderParser.GetIntValue(HeaderEnum.TRIPS.DisplayName(), value, headers),
                Omit = HeaderParser.GetStringValue(HeaderEnum.TIME_OMIT.DisplayName(), value, headers),
                Region = HeaderParser.GetStringValue(HeaderEnum.REGION.DisplayName(), value, headers),
                Note = HeaderParser.GetStringValue(HeaderEnum.NOTE.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL_PAY.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL_TIPS.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL_BONUS.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL_GRAND.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL_CASH.DisplayName(), value, headers),
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
                    case HeaderEnum.DATE:
                        objectList.Add(shift.Date);
                        break;
                    case HeaderEnum.TIME_START:
                        objectList.Add(shift.Start);
                        break;
                    case HeaderEnum.TIME_END:
                        objectList.Add(shift.End);
                        break;
                    case HeaderEnum.SERVICE:
                        objectList.Add(shift.Service);
                        break;
                    case HeaderEnum.NUMBER:
                        objectList.Add(shift.Number);
                        break;
                    case HeaderEnum.TIME_ACTIVE:
                        objectList.Add(shift.Active);
                        break;
                    case HeaderEnum.TIME_TOTAL:
                        objectList.Add(shift.Time);
                        break;
                    case HeaderEnum.TIME_OMIT:
                        objectList.Add(shift.Omit);
                        break;
                    case HeaderEnum.PAY:
                        objectList.Add(shift.Pay);
                        break;
                    case HeaderEnum.TIPS:
                        objectList.Add(shift.Tip);
                        break;
                    case HeaderEnum.BONUS:
                        objectList.Add(shift.Bonus);
                        break;
                    case HeaderEnum.CASH:
                        objectList.Add(shift.Cash);
                        break;
                    case HeaderEnum.REGION:
                        objectList.Add(shift.Region);
                        break;
                    case HeaderEnum.NOTE:
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