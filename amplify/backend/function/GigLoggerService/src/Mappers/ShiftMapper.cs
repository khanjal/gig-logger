using System.Collections.Generic;
using System.Linq;

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

    public static SheetModel GetSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.SHIFTS.DisplayName();
        sheet.TabColor = ColorEnum.RED;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;

        var tripSheet = TripMapper.GetSheet();
        var sheetTripsName = SheetEnum.TRIPS.DisplayName();
        var sheetTripsTypeRange = tripSheet.Headers.FirstOrDefault(x => x.Name == HeaderEnum.TYPE.DisplayName()).Range;

        sheet.Headers = new List<SheetCellModel>();

        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DATE.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIME_START.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIME_END.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.SERVICE.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.NUMBER.DisplayName(),
            Note = $"Shift Number 1-9{(char)10}{(char)10}Leave blank if there is only shift for that service for that day."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIME_ACTIVE.DisplayName(),
            Note = "Time with a delivery.{(char)10}{(char)10}Can be filled out on requests sheet if you have that info."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIME_TOTAL.DisplayName(),
            Note = "Total time"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIME_OMIT.DisplayName(),
            Note = $"Omit time from non service specific totals. Mainly useful if you multi app so you can get a more accurate $/hour calculation.{(char)10}{(char)10}Active time is still counted for the day from omitted shifts.{(char)10}{(char)10}IE: Omit Uber if you have it also running during DoorDash."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TRIPS.DisplayName(),
            Note = $"Requests/Deliveries/Trips{(char)10}{(char)10}Use this column if you don't track requests or need to increase the number."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.PAY.DisplayName(),
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIP.DisplayName(),
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.BONUS.DisplayName(),
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.CASH.DisplayName(),
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Format = FormatEnum.ACCOUNTING,
            Note = "Distance not accounted for on the Requests sheet."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.REGION.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.NOTE.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL_TIME_ACTIVE.DisplayName(), 
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_TIME_ACTIVE.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(F:F),SUMIF({tripSheet.GetRange(HeaderEnum.KEY)},AD1:AD,{sheetTripsName}!H:H),F1:F)))",
            Note = "Total Active time from Requests and Shifts sheets."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL_TIME.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_TIME.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(H:H=false,IF(ISBLANK(G:G),Q:Q,G:G),0)))"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL_TRIPS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_TRIPS.DisplayName()}\",ISBLANK(A1:A), \"\",true, I1:I + COUNTIF({tripSheet.GetRange(HeaderEnum.KEY)},AD1:AD)))",
            Note = "Number of requests during a shift.",
            Format = FormatEnum.NUMBER});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL_PAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_PAY.DisplayName()}\",ISBLANK(A1:A), \"\",true,J1:J + SUMIF({tripSheet.GetRange(HeaderEnum.KEY)},AD1:AD,{tripSheet.GetRange(HeaderEnum.PAY)})))",
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL_TIPS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_TIPS.DisplayName()}\",ISBLANK(A1:A), \"\",true,K1:K + SUMIF({tripSheet.GetRange(HeaderEnum.KEY)},AD1:AD,{tripSheet.GetRange(HeaderEnum.TIP)})))",
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL_BONUS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_BONUS.DisplayName()}\",ISBLANK(A1:A), \"\",true,L1:L + SUMIF({tripSheet.GetRange(HeaderEnum.KEY)},AD1:AD,{tripSheet.GetRange(HeaderEnum.BONUS)})))",
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL_GRAND.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_GRAND.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(A1:A), \"\", T1:T+U1:U+V1:V)))",
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL_CASH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_CASH.DisplayName()}\",ISBLANK(A1:A), \"\",true,SUMIF({tripSheet.GetRange(HeaderEnum.KEY)},AD1:AD,{tripSheet.GetRange(HeaderEnum.CASH)})))",
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_TRIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.AMOUNT_PER_TRIP.DisplayName()}\",ISBLANK(A1:A), \"\", AC1:AC = 0, \"\", true,IF(ISBLANK(S1:S), \"\", W1:W/IF(S1:S=0,1,S1:S))))",
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_TIME.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.AMOUNT_PER_TIME.DisplayName()}\",ISBLANK(A1:A), \"\", AD1:AD = 0, \"\", true,IF(ISBLANK(S1:S), \"\", W1:W/IF(S1:S=0,1,S1:S))))",
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_DISTANCE.DisplayName()}\",ISBLANK(A1:A), \"\",true,N1:N + SUMIF({tripSheet.GetRange(HeaderEnum.KEY)},AD1:AD,{tripSheet.GetRange(HeaderEnum.DISTANCE)})))",
            Note = "Total Miles from Requests and Shifts"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(W1:W), \"\", W1:W/IF(AA1:AA=0,1,AA1:AA))))",
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TRIPS_PER_HOUR.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TRIPS_PER_HOUR.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(G1:G), \"\", (S1:S/(G1:G*24)))))",
            Format = FormatEnum.ACCOUNTING});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.KEY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.KEY.DisplayName()}\",ISBLANK(D1:D), \"\",true,IF(ISBLANK(E1:E), A1:A & \"-0-\" & D1:D, A1:A & \"-\" & E1:E & \"-\" & D1:D)))",
            Note = "Used to connect requests to shifts."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.DAY.DisplayName()}\",ISBLANK(A1:A), \"\",true,DAY(A:A)))"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.MONTH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.MONTH.DisplayName()}\",ISBLANK(A1:A), \"\",true,MONTH(A:A)))"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.YEAR.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.YEAR.DisplayName()}\",ISBLANK(A1:A), \"\",true,YEAR(A:A)))"});

        return sheet;
    }
}