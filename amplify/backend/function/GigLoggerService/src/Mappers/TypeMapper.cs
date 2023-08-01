using System.Collections.Generic;

public static class TypeMapper
{
    public static List<TypeEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var types = new List<TypeEntity>();
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

            TypeEntity type = new()
            {
                Id = id,
                Type = HeaderParser.GetStringValue(HeaderEnum.TYPE.DisplayName(), value, headers),
                Trips = HeaderParser.GetIntValue(HeaderEnum.TRIPS.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.PAY.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.TIP.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.BONUS.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.CASH.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.DISTANCE.DisplayName(), value, headers),
            };
            
            types.Add(type);
        }
        return types;
    }

    public static SheetModel GetSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.TYPES.DisplayName();
        sheet.TabColor = ColorEnum.BLUE;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;
        sheet.ProtectSheet = true;

        var tripSheet = TripMapper.GetSheet();

        sheet.Headers = new List<SheetCellModel>();

        // A - Type
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TYPE.DisplayName(),
            Formula = "={\""+HeaderEnum.TYPE.DisplayName()+"\";SORT(UNIQUE("+tripSheet.GetRange(HeaderEnum.TYPE)+"))}"});
        // B - Trips
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TRIPS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TRIPS.DisplayName()}\",ISBLANK($A:$A), \"\",true,COUNTIF({tripSheet.GetRange(HeaderEnum.TYPE)},$A:$A)))"});
        // C - Pay
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.PAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.PAY.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({tripSheet.GetRange(HeaderEnum.TYPE)},$A:$A, {tripSheet.GetRange(HeaderEnum.PAY)})))"});
        // D - Tip
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TIP.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({tripSheet.GetRange(HeaderEnum.TYPE)},$A:$A, {tripSheet.GetRange(HeaderEnum.TIP)})))"});
        // E - Bonus
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.BONUS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.BONUS.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({tripSheet.GetRange(HeaderEnum.TYPE)},$A:$A, {tripSheet.GetRange(HeaderEnum.BONUS)})))"});
        // F - Total
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TOTAL.DisplayName()}\",ISBLANK($A:$A), \"\",true,C1:C+D1:D+E1:E))"});
        // G - Cash
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.CASH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.CASH.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({tripSheet.GetRange(HeaderEnum.TYPE)},$A:$A, {tripSheet.GetRange(HeaderEnum.CASH)})))"});
        // H - Amt/Trip
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_TRIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_TRIP.DisplayName()}\",ISBLANK($A:$A), \"\", F:F = 0, 0,true,F:F/IF(B:B=0,1,B:B)))"});
        // I - Dist
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({tripSheet.GetRange(HeaderEnum.TYPE)},$A:$A, {tripSheet.GetRange(HeaderEnum.DISTANCE)})))"});
        // J - Amt/Dist
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\", H:H = 0, 0,true,F:F/IF(I:I=0,1,I:I)))"});

        return sheet;
    }
}