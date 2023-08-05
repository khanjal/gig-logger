using System.Collections.Generic;

public static class RegionMapper
{
    public static List<RegionEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var regions = new List<RegionEntity>();
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

            RegionEntity region = new()
            {
                Id = id,
                Region = HeaderParser.GetStringValue(HeaderEnum.REGION.DisplayName(), value, headers),
                Trips = HeaderParser.GetIntValue(HeaderEnum.TRIPS.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.PAY.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.TIP.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.BONUS.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.CASH.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.DISTANCE.DisplayName(), value, headers),
            };
            
            regions.Add(region);
        }
        return regions;
    }

    public static SheetModel GetSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.REGIONS.DisplayName();
        sheet.TabColor = ColorEnum.CYAN;
        sheet.CellColor = ColorEnum.LIGHT_CYAN;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;
        sheet.ProtectSheet = true;

        var shiftSheet = ShiftMapper.GetSheet();
        var shiftSheetRange = shiftSheet.GetRange(HeaderEnum.REGION);

        sheet.Headers = new List<SheetCellModel>();

        // A - Service
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.REGION.DisplayName(),
            Formula = "={\""+HeaderEnum.REGION.DisplayName()+"\";SORT(UNIQUE({"+shiftSheetRange+"}))}"});
        // B - Trips
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TRIPS.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.TRIPS.DisplayName(), shiftSheetRange, shiftSheet.GetRange(HeaderEnum.TOTAL_TRIPS)),
            Format = FormatEnum.NUMBER});
        // C - Pay
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.PAY.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.PAY.DisplayName(), shiftSheetRange, shiftSheet.GetRange(HeaderEnum.TOTAL_PAY)),
            Format = FormatEnum.ACCOUNTING});
        // D - Tip
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIP.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.TIP.DisplayName(), shiftSheetRange, shiftSheet.GetRange(HeaderEnum.TOTAL_TIPS)),
            Format = FormatEnum.ACCOUNTING});
        // E - Bonus
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.BONUS.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.BONUS.DisplayName(), shiftSheetRange, shiftSheet.GetRange(HeaderEnum.TOTAL_BONUS)),
            Format = FormatEnum.ACCOUNTING});
        // F - Total
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TOTAL.DisplayName()}\",ISBLANK($A:$A), \"\",true,C1:C+D1:D+E1:E))",
            Format = FormatEnum.ACCOUNTING});
        // G - Cash
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.CASH.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.CASH.DisplayName(), shiftSheetRange, shiftSheet.GetRange(HeaderEnum.TOTAL_CASH)),
            Format = FormatEnum.ACCOUNTING});
        // H - Amt/Trip
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_TRIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_TRIP.DisplayName()}\",ISBLANK($A:$A), \"\", F:F = 0, 0,true,F:F/IF(B:B=0,1,B:B)))",
            Format = FormatEnum.ACCOUNTING});
        // I - Dist
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.DISTANCE.DisplayName(), shiftSheetRange, shiftSheet.GetRange(HeaderEnum.TOTAL_DISTANCE)),
            Format = FormatEnum.NUMBER});
        // J - Amt/Dist
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\", H:H = 0, 0,true,F:F/IF(I:I=0,1,I:I)))",
            Format = FormatEnum.ACCOUNTING});
        // K - First Visit
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.VISIT_FIRST.DisplayName(),
            Formula = SheetHelper.ArrayFormulaVisit(HeaderEnum.VISIT_FIRST.DisplayName(), SheetEnum.TRIPS.DisplayName(), shiftSheet.GetColumn(HeaderEnum.DATE), shiftSheet.GetColumn(HeaderEnum.REGION), true),
            Format = FormatEnum.DATE});
        // L - Last Visit
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.VISIT_LAST.DisplayName(),
            Formula = SheetHelper.ArrayFormulaVisit(HeaderEnum.VISIT_LAST.DisplayName(), SheetEnum.TRIPS.DisplayName(), shiftSheet.GetColumn(HeaderEnum.DATE), shiftSheet.GetColumn(HeaderEnum.REGION), false),
            Format = FormatEnum.DATE});

        return sheet;
    }
}