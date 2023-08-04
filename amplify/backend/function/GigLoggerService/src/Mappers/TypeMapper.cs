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
        sheet.TabColor = ColorEnum.CYAN;
        sheet.CellColor = ColorEnum.LIGHT_CYAN;
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
            Formula = string.Format(SheetHelper.ArrayFormulaCountIf(), HeaderEnum.TRIPS.DisplayName(), tripSheet.GetRange(HeaderEnum.TYPE)),
            Format = FormatEnum.NUMBER});
        // C - Pay
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.PAY.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.PAY.DisplayName(), tripSheet.GetRange(HeaderEnum.TYPE), tripSheet.GetRange(HeaderEnum.PAY)),
            Format = FormatEnum.ACCOUNTING});
        // D - Tip
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIP.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.TIP.DisplayName(), tripSheet.GetRange(HeaderEnum.TYPE), tripSheet.GetRange(HeaderEnum.TIP)),
            Format = FormatEnum.ACCOUNTING});
        // E - Bonus
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.BONUS.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.BONUS.DisplayName(), tripSheet.GetRange(HeaderEnum.TYPE), tripSheet.GetRange(HeaderEnum.BONUS)),
            Format = FormatEnum.ACCOUNTING});
        // F - Total
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TOTAL.DisplayName()}\",ISBLANK($A:$A), \"\",true,C1:C+D1:D+E1:E))",
            Format = FormatEnum.ACCOUNTING});
        // G - Cash
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.CASH.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.CASH.DisplayName(), tripSheet.GetRange(HeaderEnum.TYPE), tripSheet.GetRange(HeaderEnum.CASH)),
            Format = FormatEnum.ACCOUNTING});
        // H - Amt/Trip
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_TRIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_TRIP.DisplayName()}\",ISBLANK($A:$A), \"\", F:F = 0, 0,true,F:F/IF(B:B=0,1,B:B)))",
            Format = FormatEnum.ACCOUNTING});
        // I - Dist
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.DISTANCE.DisplayName(), tripSheet.GetRange(HeaderEnum.TYPE), tripSheet.GetRange(HeaderEnum.DISTANCE)),
            Format = FormatEnum.NUMBER});
        // J - Amt/Dist
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\", H:H = 0, 0,true,F:F/IF(I:I=0,1,I:I)))",
            Format = FormatEnum.ACCOUNTING});

        return sheet;
    }
}