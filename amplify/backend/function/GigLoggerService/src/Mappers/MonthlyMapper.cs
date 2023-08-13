using System.Collections.Generic;

public static class MonthlyMapper
{

    public static SheetModel GetSheet() {
        var sheet = new SheetModel
        {
            Name = SheetEnum.MONTHLY.DisplayName(),
            TabColor = ColorEnum.LIGHT_GREEN,
            CellColor = ColorEnum.LIGHT_GRAY,
            FreezeColumnCount = 1,
            FreezeRowCount = 1,
            ProtectSheet = true
        };

        var dailySheet = DailyMapper.GetSheet();

        sheet.Headers = SheetHelper.GetCommonTripGroupSheetHeaders(dailySheet, HeaderEnum.MONTH);
        var sheetKeyRange = sheet.GetLocalRange(HeaderEnum.MONTH);

        // #
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.NUMBER.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW({sheetKeyRange})=1,\"{HeaderEnum.NUMBER.DisplayName()}\",ISBLANK({sheetKeyRange}), \"\",true,IFERROR(INDEX(SPLIT({sheetKeyRange}, \"-\"), 0,1), 0)))"});

        // Year
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.YEAR.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW({sheetKeyRange})=1,\"{HeaderEnum.YEAR.DisplayName()}\",ISBLANK({sheetKeyRange}), \"\",true,IFERROR(INDEX(SPLIT({sheetKeyRange}, \"-\"), 0,2), 0)))"});
        
        return sheet;
    }
}