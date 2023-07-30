using System.Collections.Generic;
using Google.Apis.Sheets.v4.Data;

public static class SheetHelper {
    public static List<SheetModel> GetSheets() {
        var sheets = new List<SheetModel>();
        
        sheets.Add(GetTripSheet());
        sheets.Add(GetShiftSheet());

        return sheets;
    }

    public static SheetModel GetPlaceSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.PLACES.DisplayName();
        sheet.TabColor = ColorEnum.BLUE;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;
        sheet.ProtectSheet = true;

        sheet.Headers = new List<SheetHeaderModel>();

        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.PLACE.DisplayName(),
            Formula = "={\""+HeaderEnum.PLACE.DisplayName()+"\";SORT(UNIQUE("+SheetEnum.TRIPS.DisplayName()+"!E2:E))}"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TRIPS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TRIPS.DisplayName()}\",ISBLANK($A:$A), \"\",true,COUNTIF({SheetEnum.TRIPS.DisplayName()}!E:E,$A:$A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.PAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.PAY.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!E:E,$A:$A, {SheetEnum.TRIPS.DisplayName()}!I:I)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TIP.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!E:E,$A:$A, {SheetEnum.TRIPS.DisplayName()}!J:J)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.BONUS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.BONUS.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!E:E,$A:$A, {SheetEnum.TRIPS.DisplayName()}!K:K)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TOTAL.DisplayName()}\",ISBLANK($A:$A), \"\",true,C1:C+D1:D+E1:E))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.CASH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.CASH.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!E:E,$A:$A, {SheetEnum.TRIPS.DisplayName()}!M:M)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AMOUNT_PER_TRIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_TRIP.DisplayName()}\",ISBLANK($A:$A), \"\", F:F = 0, 0,true,F:F/IF(B:B=0,1,B:B)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!E:E,$A:$A, {SheetEnum.TRIPS.DisplayName()}!P:P)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\", H:H = 0, 0,true,F:F/IF(I:I=0,1,I:I)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.VISIT_FIRST.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.VISIT_FIRST.DisplayName()}\",ISBLANK($A:$A), \"\",true,IFERROR(VLOOKUP($A:$A,SORT(QUERY({SheetEnum.TRIPS.DisplayName()}!A:E,\"SELECT E, A\"),2,true),2,0),\"\")))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.VISIT_LAST.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.VISIT_LAST.DisplayName()}\",ISBLANK($A:$A), \"\",true,IFERROR(VLOOKUP($A:$A,SORT(QUERY({SheetEnum.TRIPS.DisplayName()}!A:E,\"SELECT E, A\"),2,false),2,0),\"\")))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DAYS_PER_VISIT.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.DAYS_PER_VISIT.DisplayName()}\",ISBLANK($A:$A), \"\", true, DAYS(K:K,J:J)/B:B))",
            Note = $"Average days between visits.{(char)10}{(char)10}Doesn't take into account active time vs all time."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DAYS_SINCE_VISIT.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.DAYS_SINCE_VISIT.DisplayName()}\",ISBLANK($A:$A), \"\", true, DAYS(TODAY(),K:K)))",
            Note = "Days since last visit."});

        return sheet;
    }

    public static SheetModel GetShiftSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.SHIFTS.DisplayName();
        sheet.TabColor = ColorEnum.RED;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;

        sheet.Headers = new List<SheetHeaderModel>();

        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DATE.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TIME_START.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TIME_END.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.SERVICE.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.NUMBER.DisplayName(),
            Note = $"Shift Number 1-9{(char)10}{(char)10}Leave blank if there is only shift for that service for that day."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TIME_ACTIVE.DisplayName(),
            Note = "Time with a delivery.{(char)10}{(char)10}Can be filled out on requests sheet if you have that info."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TIME_TOTAL.DisplayName(),
            Note = "Total time"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TIME_OMIT.DisplayName(),
            Note = $"Omit time from non service specific totals. Mainly useful if you multi app so you can get a more accurate $/hour calculation.{(char)10}{(char)10}Active time is still counted for the day from omitted shifts.{(char)10}{(char)10}IE: Omit Uber if you have it also running during DoorDash."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TRIPS.DisplayName(),
            Note = $"Requests/Deliveries/Trips{(char)10}{(char)10}Use this column if you don't track requests or need to increase the number."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.PAY.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TIP.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.BONUS.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.CASH.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Note = "Distance not accounted for on the Requests sheet."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.REGION.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.NOTE.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL_TIME_ACTIVE.DisplayName(), 
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_TIME_ACTIVE.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(F:F),SUMIF({SheetEnum.TRIPS.DisplayName()}!X:X,AG1:AG,{SheetEnum.TRIPS.DisplayName()}!H:H),F1:F)))",
            Note = "Total Active time from Requests and Shifts sheets."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL_TIME.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_TIME.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(H:H=false,IF(ISBLANK(G:G),Q:Q,G:G),0)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL_TRIPS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_TRIPS.DisplayName()}\",ISBLANK(A1:A), \"\",true, I1:I + COUNTIF({SheetEnum.TRIPS.DisplayName()}!X:X,AG1:AG)))",
            Note = "Number of requests during a shift."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL_PAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_PAY.DisplayName()}\",ISBLANK(A1:A), \"\",true,J1:J + SUMIF({SheetEnum.TRIPS.DisplayName()}!X:X,AG1:AG,Trips!I:I)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL_TIPS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_TIPS.DisplayName()}\",ISBLANK(A1:A), \"\",true,K1:K + SUMIF({SheetEnum.TRIPS.DisplayName()}!X:X,AG1:AG,{SheetEnum.TRIPS.DisplayName()}!J:J)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL_BONUS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_BONUS.DisplayName()}\",ISBLANK(A1:A), \"\",true,L1:L + SUMIF({SheetEnum.TRIPS.DisplayName()}!X:X,AG1:AG,{SheetEnum.TRIPS.DisplayName()}!K:K)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL_GRAND.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_GRAND.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(A1:A), \"\", T1:T+U1:U+V1:V)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL_CASH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_CASH.DisplayName()}\",ISBLANK(A1:A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!X:X,AG1:AG,{SheetEnum.TRIPS.DisplayName()}!M:M)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AMOUNT_PER_TIME.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.AMOUNT_PER_TIME.DisplayName()}\",ISBLANK(A1:A), \"\", AD1:AD = 0, \"\", true,IF(ISBLANK(S1:S), \"\", W1:W/IF(S1:S=0,1,S1:S))))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL_DISTANCE.DisplayName()}\",ISBLANK(A1:A), \"\",true,N1:N + SUMIF({SheetEnum.TRIPS.DisplayName()}!X:X,AG1:AG,{SheetEnum.TRIPS.DisplayName()}!P:P)))",
            Note = "Total Miles from Requests and Shifts"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(W1:W), \"\", W1:W/IF(AA1:AA=0,1,AA1:AA))))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.KEY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.KEY.DisplayName()}\",ISBLANK(B1:B), \"\",true,IF(ISBLANK(C1:C), A1:A & \"-0-\" & B1:B, A1:A & \"-\" & C1:C & \"-\" & B1:B)))",
            Note = "Used to connect requests to shifts."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.DAY.DisplayName()}\",ISBLANK(A1:A), \"\",true,DAY(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.MONTH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.MONTH.DisplayName()}\",ISBLANK(A1:A), \"\",true,MONTH(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.YEAR.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.YEAR.DisplayName()}\",ISBLANK(A1:A), \"\",true,YEAR(A:A)))"});

        return sheet;
    }

    public static SheetModel GetTripSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.TRIPS.DisplayName();
        sheet.TabColor = ColorEnum.RED;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;

        sheet.Headers = new List<SheetHeaderModel>();

        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DATE.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.SERVICE.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.NUMBER.DisplayName(),
            Note = "Shift Number 1-9 Leave blank if there is only shift for that service for that day."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TYPE.DisplayName(),
            Note = "Pickup, Shop, Order, Curbside, Canceled"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.PLACE.DisplayName(),
            Note = "Location of pickup (delivery)."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.PICKUP.DisplayName(),
            Note = "Time when request/ride picked up."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DROPOFF.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DURATION.DisplayName(),
            Note = "Minutes task took to complete."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.PAY.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TIP.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.BONUS.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL.DisplayName(), 
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(A1:A), \"\",I1:I+J1:J+K1:K)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.CASH.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ODOMETER_START.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ODOMETER_END.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Note = "How many miles/km the request took."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.NAME.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ADDRESS_START.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ADDRESS_END.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.UNIT_END.DisplayName(),
            Note = "Apartment, Unit, Room, Suite"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ORDER_NUMBER.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.NOTE.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.REGION.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.REGION.DisplayName()}\",ISBLANK($A:$A), \"\",true,IFERROR(VLOOKUP($X:$X,SORT(QUERY({SheetEnum.SHIFTS.DisplayName()}!O:AG,\"SELECT AG, O\"),2,true),2,0),\"\")))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.KEY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.KEY.DisplayName()}\",ISBLANK(B1:B), \"\",true,IF(ISBLANK(C1:C), A1:A & \"-0-\" & B1:B, A1:A & \"-\" & C1:C & \"-\" & B1:B)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.DAY.DisplayName()}\",ISBLANK(A1:A), \"\",true,DAY(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.MONTH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.MONTH.DisplayName()}\",ISBLANK(A1:A), \"\",true,MONTH(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.YEAR.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.YEAR.DisplayName()}\",ISBLANK(A1:A), \"\",true,YEAR(A:A)))"});

        return sheet;
    }

    public static SheetModel GetTypeSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.TYPES.DisplayName();
        sheet.TabColor = ColorEnum.BLUE;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;
        sheet.ProtectSheet = true;

        sheet.Headers = new List<SheetHeaderModel>();

        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TYPE.DisplayName(),
            Formula = "={\""+HeaderEnum.TYPE.DisplayName()+"\";SORT(UNIQUE("+SheetEnum.TRIPS.DisplayName()+"!D2:D))}"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TRIPS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TRIPS.DisplayName()}\",ISBLANK($A:$A), \"\",true,COUNTIF({SheetEnum.TRIPS.DisplayName()}!D:D,$A:$A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.PAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.PAY.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!D:D,$A:$A, {SheetEnum.TRIPS.DisplayName()}!I:I)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TIP.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!D:D,$A:$A, {SheetEnum.TRIPS.DisplayName()}!J:J)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.BONUS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.BONUS.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!D:D,$A:$A, {SheetEnum.TRIPS.DisplayName()}!K:K)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TOTAL.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TOTAL.DisplayName()}\",ISBLANK($A:$A), \"\",true,C1:C+D1:D+E1:E))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.CASH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.CASH.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!D:D,$A:$A, {SheetEnum.TRIPS.DisplayName()}!M:M)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AMOUNT_PER_TRIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_TRIP.DisplayName()}\",ISBLANK($A:$A), \"\", F:F = 0, 0,true,F:F/IF(B:B=0,1,B:B)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.TRIPS.DisplayName()}!D:D,$A:$A, {SheetEnum.TRIPS.DisplayName()}!P:P)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\", H:H = 0, 0,true,F:F/IF(I:I=0,1,I:I)))"});

        return sheet;
    }

    // https://www.rapidtables.com/convert/color/hex-to-rgb.html
    public static Color GetColor(ColorEnum colorEnum) {
        switch (colorEnum)
        {
            case ColorEnum.BLACK:
                return new Color{ Red = 0, Green = 0, Blue = 0 };
            case ColorEnum.BLUE:
                return new Color{ Red = 0, Green = 0, Blue = 1 };
            case ColorEnum.GREEN:
                return new Color{ Red = 0, Green = (float?)0.5, Blue = 0 };
            case ColorEnum.LIME:
                return new Color{ Red = 0, Green = 1, Blue = 0 };
            case ColorEnum.ORANGE:
                return new Color{ Red = 1, Green = (float?)0.6, Blue = 0 };
            case ColorEnum.MAGENTA:
            case ColorEnum.PINK:
                return new Color{ Red = 1, Green = 0, Blue = 1 };
            case ColorEnum.PURPLE:
                return new Color{ Red = (float?)0.5, Green = 0, Blue = (float?)0.5 };
            case ColorEnum.RED:
                return new Color{ Red = 1, Green = 0, Blue = 0 };
            case ColorEnum.WHITE:
                return new Color{ Red = 1, Green = 1, Blue = 1 };
            case ColorEnum.YELLOW:
                return new Color{ Red = 1, Green = 1, Blue = 0 };
            default:
                return null;
        }
    }

    public static IList<IList<object>> HeadersToList(List<SheetHeaderModel> headers)
    {
        var rangeData = new List<IList<object>>();
        var objectList = new List<object>();

        foreach (var header in headers)
        {
            if (!string.IsNullOrEmpty(header.Formula)) {
                objectList.Add(header.Formula);
            }
            else {
                objectList.Add(header.Name);
            }
        }

        rangeData.Add(objectList);
        
        return rangeData;
    }

    public static IList<RowData> HeadersToRowData(SheetModel sheet)
    {
        var rows = new List<RowData>();
        var row = new RowData();
        var cells = new List<CellData>();

        foreach (var header in sheet.Headers)
        {
            var cell = new CellData();
            cell.UserEnteredFormat = new CellFormat();
            var value = new ExtendedValue();

            if (!string.IsNullOrEmpty(header.Formula)) {
                value.FormulaValue = header.Formula;

                if (!sheet.ProtectSheet) {
                    var border = new Border();
                    border.Style = BorderStyleEnum.SOLID_THICK.ToString();
                    cell.UserEnteredFormat.Borders = new Borders { Bottom = border, Left = border, Right = border, Top = border};
                }
            }
            else {
                value.StringValue = header.Name;
            }

            if(!string.IsNullOrEmpty(header.Note)) {
                cell.Note = header.Note;
            }

            cell.UserEnteredValue = value;
            cells.Add(cell);
        }

        row.Values = cells;
        rows.Add(row);

        return rows;
    }
}