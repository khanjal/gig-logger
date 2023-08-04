using System.Collections.Generic;

public static class ServiceMapper
{
    public static List<ServiceEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var services = new List<ServiceEntity>();
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

            ServiceEntity service = new()
            {
                Id = id,
                Service = HeaderParser.GetStringValue(HeaderEnum.SERVICE.DisplayName(), value, headers),
                Trips = HeaderParser.GetIntValue(HeaderEnum.TRIPS.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.PAY.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.TIP.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.BONUS.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.CASH.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.DISTANCE.DisplayName(), value, headers),
            };
            
            services.Add(service);
        }
        return services;
    }

    public static SheetModel GetSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.SERVICES.DisplayName();
        sheet.TabColor = ColorEnum.CYAN;
        sheet.CellColor = ColorEnum.LIGHT_CYAN;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;
        sheet.ProtectSheet = true;

        var shiftSheet = ShiftMapper.GetSheet();

        sheet.Headers = new List<SheetCellModel>();

        // A - Service
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.SERVICE.DisplayName(),
            Formula = "={\""+HeaderEnum.SERVICE.DisplayName()+"\";SORT(UNIQUE({"+shiftSheet.GetRange(HeaderEnum.SERVICE)+"}))}"});
        // B - Trips
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TRIPS.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.TRIPS.DisplayName(), shiftSheet.GetRange(HeaderEnum.SERVICE), shiftSheet.GetRange(HeaderEnum.TOTAL_TRIPS)),
            Format = FormatEnum.NUMBER});
        // C - Pay
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.PAY.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.PAY.DisplayName(), shiftSheet.GetRange(HeaderEnum.SERVICE), shiftSheet.GetRange(HeaderEnum.TOTAL_PAY)),
            Format = FormatEnum.ACCOUNTING});
        // D - Tip
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIP.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.TIP.DisplayName(), shiftSheet.GetRange(HeaderEnum.SERVICE), shiftSheet.GetRange(HeaderEnum.TOTAL_TIPS)),
            Format = FormatEnum.ACCOUNTING});
        // E - Bonus
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.BONUS.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.BONUS.DisplayName(), shiftSheet.GetRange(HeaderEnum.SERVICE), shiftSheet.GetRange(HeaderEnum.TOTAL_BONUS)),
            Format = FormatEnum.ACCOUNTING});
        // F - Total
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TOTAL.DisplayName()}\",ISBLANK($A:$A), \"\",true,C1:C+D1:D+E1:E))",
            Format = FormatEnum.ACCOUNTING});
        // G - Cash
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.CASH.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.CASH.DisplayName(), shiftSheet.GetRange(HeaderEnum.SERVICE), shiftSheet.GetRange(HeaderEnum.TOTAL_CASH)),
            Format = FormatEnum.ACCOUNTING});
        // H - Amt/Trip
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_TRIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_TRIP.DisplayName()}\",ISBLANK($A:$A), \"\", F:F = 0, 0,true,F:F/IF(B:B=0,1,B:B)))",
            Format = FormatEnum.ACCOUNTING});
        // I - Dist
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Formula = string.Format(SheetHelper.ArrayFormulaSumIf(), HeaderEnum.DISTANCE.DisplayName(), shiftSheet.GetRange(HeaderEnum.SERVICE), shiftSheet.GetRange(HeaderEnum.TOTAL_DISTANCE)),
            Format = FormatEnum.NUMBER});
        // J - Amt/Dist
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\", H:H = 0, 0,true,F:F/IF(I:I=0,1,I:I)))",
            Format = FormatEnum.ACCOUNTING});
        // K - First Visit
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.VISIT_FIRST.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.VISIT_FIRST.DisplayName()}\",ISBLANK($A:$A), \"\", true, IFERROR(VLOOKUP($A:$A,SORT(QUERY({SheetEnum.TRIPS}!A:B,\"SELECT B, A\"),2,true),2,0),\"\")))",
            Format = FormatEnum.DATE});
        // L - Last Visit
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.VISIT_LAST.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.VISIT_LAST.DisplayName()}\",ISBLANK($A:$A), \"\", true, IFERROR(VLOOKUP($A:$A,SORT(QUERY({SheetEnum.TRIPS}!A:B,\"SELECT B, A\"),2,false),2,0),\"\")))",
            Format = FormatEnum.DATE});

        return sheet;
    }
}