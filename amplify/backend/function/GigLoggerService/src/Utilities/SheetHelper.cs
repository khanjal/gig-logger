using System.Collections.Generic;
using Google.Apis.Sheets.v4.Data;

public static class SheetHelper {
    public static List<SheetModel> GetSheets() {
        var sheets = new List<SheetModel>();
        
        sheets.Add(GetTripSheet());
        sheets.Add(GetShiftSheet());

        return sheets;
    }

    public static SheetModel GetShiftSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.Shifts.DisplayName();
        sheet.TabColor = ColorEnum.Red;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;

        sheet.Headers = new List<SheetHeaderModel>();

        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Date.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeStart.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeEnd.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Service.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Number.DisplayName(),
            Note = $"Shift Number 1-9{(char)10}{(char)10}Leave blank if there is only shift for that service for that day."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeActive.DisplayName(),
            Note = "Time with a delivery.{(char)10}{(char)10}Can be filled out on requests sheet if you have that info."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeTotal.DisplayName(),
            Note = "Total time"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeOmit.DisplayName(),
            Note = $"Omit time from non service specific totals. Mainly useful if you multi app so you can get a more accurate $/hour calculation.{(char)10}{(char)10}Active time is still counted for the day from omitted shifts.{(char)10}{(char)10}IE: Omit Uber if you have it also running during DoorDash."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Trips.DisplayName(),
            Note = $"Requests/Deliveries/Trips{(char)10}{(char)10}Use this column if you don't track requests or need to increase the number."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Pay.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Tip.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Bonus.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Cash.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Distance.DisplayName(),
            Note = "Distance not accounted for on the Requests sheet."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Region.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Note.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TotalTimeActive.DisplayName(), 
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TotalTimeActive.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(F:F),SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,{SheetEnum.Trips.DisplayName()}!H:H),F1:F)))",
            Note = "Total Active time from Requests and Shifts sheets."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TotalTime.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TotalTime.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(H:H=false,IF(ISBLANK(G:G),Q:Q,G:G),0)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TotalTrips.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TotalTrips.DisplayName()}\",ISBLANK(A1:A), \"\",true, I1:I + COUNTIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG)))",
            Note = "Number of requests during a shift."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TotalPay.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TotalPay.DisplayName()}\",ISBLANK(A1:A), \"\",true,J1:J + SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,Trips!I:I)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TotalTips.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TotalTips.DisplayName()}\",ISBLANK(A1:A), \"\",true,K1:K + SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,{SheetEnum.Trips.DisplayName()}!J:J)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TotalBonus.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TotalBonus.DisplayName()}\",ISBLANK(A1:A), \"\",true,L1:L + SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,{SheetEnum.Trips.DisplayName()}!K:K)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TotalGrand.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TotalGrand.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(A1:A), \"\", T1:T+U1:U+V1:V)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TotalCash.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TotalCash.DisplayName()}\",ISBLANK(A1:A), \"\",true,SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,{SheetEnum.Trips.DisplayName()}!M:M)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AmountPerTime.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.AmountPerTime.DisplayName()}\",ISBLANK(A1:A), \"\", AD1:AD = 0, \"\", true,IF(ISBLANK(S1:S), \"\", W1:W/IF(S1:S=0,1,S1:S))))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TotalDistance.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TotalDistance.DisplayName()}\",ISBLANK(A1:A), \"\",true,N1:N + SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,{SheetEnum.Trips.DisplayName()}!P:P)))",
            Note = "Total Miles from Requests and Shifts"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AmountPerDistance.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.AmountPerDistance.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(W1:W), \"\", W1:W/IF(AA1:AA=0,1,AA1:AA))))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Key.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Key.DisplayName()}\",ISBLANK(B1:B), \"\",true,IF(ISBLANK(C1:C), A1:A & \"-0-\" & B1:B, A1:A & \"-\" & C1:C & \"-\" & B1:B)))",
            Note = "Used to connect requests to shifts."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Day.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Day.DisplayName()}\",ISBLANK(A1:A), \"\",true,DAY(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Month.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Month.DisplayName()}\",ISBLANK(A1:A), \"\",true,MONTH(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Year.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Year.DisplayName()}\",ISBLANK(A1:A), \"\",true,YEAR(A:A)))"});

        return sheet;
    }

    public static SheetModel GetTripSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.Trips.DisplayName();
        sheet.TabColor = ColorEnum.Red;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;

        sheet.Headers = new List<SheetHeaderModel>();

        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Date.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Service.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Number.DisplayName(),
            Note = "Shift Number 1-9 Leave blank if there is only shift for that service for that day."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Type.DisplayName(),
            Note = "Pickup, Shop, Order, Curbside, Canceled"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Place.DisplayName(),
            Note = "Location of pickup (delivery)."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Pickup.DisplayName(),
            Note = "Time when request/ride picked up."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Dropoff.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Duration.DisplayName(),
            Note = "Minutes task took to complete."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Pay.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Tips.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Bonus.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Total.DisplayName(), 
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Total.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(A1:A), \"\",I1:I+J1:J+K1:K)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Cash.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.OdometerStart.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.OdometerEnd.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Distance.DisplayName(),
            Note = "How many miles/km the request took."});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Name.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AddressStart.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AddressEnd.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.UnitEnd.DisplayName(),
            Note = "Apartment, Unit, Room, Suite"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.OrderNumber.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Note.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Region.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Region.DisplayName()}\",ISBLANK($A:$A), \"\",true,IFERROR(VLOOKUP($X:$X,SORT(QUERY({SheetEnum.Shifts.DisplayName()}!O:AG,\"SELECT AG, O\"),2,true),2,0),\"\")))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Key.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Key.DisplayName()}\",ISBLANK(B1:B), \"\",true,IF(ISBLANK(C1:C), A1:A & \"-0-\" & B1:B, A1:A & \"-\" & C1:C & \"-\" & B1:B)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Day.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Day.DisplayName()}\",ISBLANK(A1:A), \"\",true,DAY(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Month.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Month.DisplayName()}\",ISBLANK(A1:A), \"\",true,MONTH(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Year.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Year.DisplayName()}\",ISBLANK(A1:A), \"\",true,YEAR(A:A)))"});

        return sheet;
    }

    public static SheetModel GetTypeSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.Types.DisplayName();
        sheet.TabColor = ColorEnum.Blue;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;
        sheet.ProtectSheet = true;

        sheet.Headers = new List<SheetHeaderModel>();

        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Type.DisplayName(),
            Formula = "={\""+HeaderEnum.Trips.DisplayName()+"\";SORT(UNIQUE("+SheetEnum.Trips.DisplayName()+"!D2:D))}"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Trips.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Trips.DisplayName()}\",ISBLANK($A:$A), \"\",true,COUNTIF({SheetEnum.Trips.DisplayName()}!D:D,$A:$A)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Pay.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Pay.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.Trips.DisplayName()}!D:D,$A:$A, {SheetEnum.Trips.DisplayName()}!I:I)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Tip.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Tip.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.Trips.DisplayName()}!D:D,$A:$A, {SheetEnum.Trips.DisplayName()}!J:J)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Bonus.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Bonus.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.Trips.DisplayName()}!D:D,$A:$A, {SheetEnum.Trips.DisplayName()}!K:K)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Total.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Total.DisplayName()}\",ISBLANK($A:$A), \"\",true,C1:C+D1:D+E1:E))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Cash.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Cash.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.Trips.DisplayName()}!D:D,$A:$A, {SheetEnum.Trips.DisplayName()}!M:M)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AmountPerTrip.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AmountPerTrip.DisplayName()}\",ISBLANK($A:$A), \"\", F:F = 0, 0,true,F:F/IF(B:B=0,1,B:B)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Distance.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Distance.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({SheetEnum.Trips.DisplayName()}!D:D,$A:$A, {SheetEnum.Trips.DisplayName()}!M:M)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AmountPerDistance.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AmountPerDistance.DisplayName()}\",ISBLANK($A:$A), \"\", H:H = 0, 0,true,F:F/IF(I:I=0,1,I:I)))"});

        return sheet;
    }

    // https://www.rapidtables.com/convert/color/hex-to-rgb.html
    public static Color GetColor(ColorEnum colorEnum) {
        switch (colorEnum)
        {
            case ColorEnum.Black:
                return new Color{ Red = 0, Green = 0, Blue = 0 };
            case ColorEnum.Blue:
                return new Color{ Red = 0, Green = 0, Blue = 1 };
            case ColorEnum.Green:
                return new Color{ Red = 0, Green = (float?)0.5, Blue = 0 };
            case ColorEnum.Lime:
                return new Color{ Red = 0, Green = 1, Blue = 0 };
            case ColorEnum.Orange:
                return new Color{ Red = 1, Green = (float?)0.6, Blue = 0 };
            case ColorEnum.Magenta:
            case ColorEnum.Pink:
                return new Color{ Red = 1, Green = 0, Blue = 1 };
            case ColorEnum.Purple:
                return new Color{ Red = (float?)0.5, Green = 0, Blue = (float?)0.5 };
            case ColorEnum.Red:
                return new Color{ Red = 1, Green = 0, Blue = 0 };
            case ColorEnum.White:
                return new Color{ Red = 1, Green = 1, Blue = 1 };
            case ColorEnum.Yellow:
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