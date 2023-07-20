using System.Collections.Generic;

public static class SheetHelper {
    public static List<SheetModel> GetSheets() {
        var sheets = new List<SheetModel>();
        
        sheets.Add(GetTripSheet());
        

        return sheets;
    }

    public static SheetModel GetShiftSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.Shifts.DisplayName();

        sheet.Headers = new List<SheetHeaderModel>();

        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Date.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeStart.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeEnd.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Service.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Number.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeActive.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeTotal.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.TimeOmit.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ShiftTrips.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ShiftPay.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ShiftTip.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ShiftBonus.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.ShiftCash.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Region.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Note.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.TimeActive.DisplayName(), 
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TimeActive.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(F:F),SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,{SheetEnum.Trips.DisplayName()}!H:H),F1:F)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.TimeTotal.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TimeTotal.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(H:H=false,IF(ISBLANK(G:G),Q:Q,G:G),0)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Trips.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Trips.DisplayName()}\",ISBLANK(A1:A), \"\",true, I1:I + COUNTIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Pay.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Pay.DisplayName()}\",ISBLANK(A1:A), \"\",true,J1:J + SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,Trips!I:I)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Tips.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Tips.DisplayName()}\",ISBLANK(A1:A), \"\",true,K1:K + SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,{SheetEnum.Trips.DisplayName()}!J:J)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Bonus.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Bonus.DisplayName()}\",ISBLANK(A1:A), \"\",true,L1:L + SUMIF({SheetEnum.Trips.DisplayName()}!X:X,AG1:AG,{SheetEnum.Trips.DisplayName()}!K:K)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AddressStart.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AddressEnd.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.OrderNumber.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Note.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Region.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Region.DisplayName()}\",ISBLANK($A:$A), \"\",true,IFERROR(VLOOKUP($X:$X,SORT(QUERY({SheetEnum.Shifts.DisplayName()}!O:AG,\"SELECT AG, O\"),2,true),2,0),\"\")))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Key.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Key.DisplayName()}\",ISBLANK(B1:B), \"\",true,IF(ISBLANK(C1:C), A1:A & \"-0-\" & B1:B, A1:A & \"-\" & C1:C & \"-\" & B1:B)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Day.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Day.DisplayName()}\",ISBLANK(A1:A), \"\",true,DAY(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Month.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Month.DisplayName()}\",ISBLANK(A1:A), \"\",true,MONTH(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Year.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Year.DisplayName()}\",ISBLANK(A1:A), \"\",true,YEAR(A:A)))"});

        return sheet;
    }

    public static SheetModel GetTripSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.Trips.DisplayName();

        sheet.Headers = new List<SheetHeaderModel>();

        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Date.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Service.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Number.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Type.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Place.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Pickup.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Dropoff.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Duration.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Pay.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Tip.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Bonus.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Total.DisplayName(), 
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Total.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(A1:A), \"\",I1:I+J1:J+K1:K)))"});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Cash.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.OdometerStart.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.OdometerEnd.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Distance.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Name.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AddressStart.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.AddressEnd.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.OrderNumber.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{Name = HeaderEnum.Note.DisplayName()});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Region.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.Region.DisplayName()}\",ISBLANK($A:$A), \"\",true,IFERROR(VLOOKUP($X:$X,SORT(QUERY({SheetEnum.Shifts.DisplayName()}!O:AG,\"SELECT AG, O\"),2,true),2,0),\"\")))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Key.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Key.DisplayName()}\",ISBLANK(B1:B), \"\",true,IF(ISBLANK(C1:C), A1:A & \"-0-\" & B1:B, A1:A & \"-\" & C1:C & \"-\" & B1:B)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Day.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Day.DisplayName()}\",ISBLANK(A1:A), \"\",true,DAY(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Month.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Month.DisplayName()}\",ISBLANK(A1:A), \"\",true,MONTH(A:A)))"});
        sheet.Headers.Add(new SheetHeaderModel{
            Name = HeaderEnum.Year.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.Year.DisplayName()}\",ISBLANK(A1:A), \"\",true,YEAR(A:A)))"});

        return sheet;
    }
}