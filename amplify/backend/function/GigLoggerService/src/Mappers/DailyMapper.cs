using System.Collections.Generic;

public static class DailyMapper
{

    public static SheetModel GetSheet() {
        var sheet = new SheetModel
        {
            Name = SheetEnum.DAILY.DisplayName(),
            TabColor = ColorEnum.LIGHT_GREEN,
            CellColor = ColorEnum.LIGHT_GRAY,
            FreezeColumnCount = 1,
            FreezeRowCount = 1,
            ProtectSheet = true
        };

        var shiftSheet = ShiftMapper.GetSheet();

        sheet.Headers = SheetHelper.GetCommonShiftGroupSheetHeaders(shiftSheet, HeaderEnum.DATE);
        var sheetKeyRange = sheet.GetLocalRange(HeaderEnum.DATE);

        // Day
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW({sheetKeyRange})=1,\"{HeaderEnum.DAY.DisplayName()}\",ISBLANK({sheetKeyRange}), \"\",true,WEEKDAY({sheetKeyRange})))",
            Format = FormatEnum.WEEKDAY});
        // Week
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.WEEK.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW({sheetKeyRange})=1,\"{HeaderEnum.WEEK.DisplayName()}\",ISBLANK({sheetKeyRange}), \"\",true,WEEKNUM({sheetKeyRange},2)&\"-\"&YEAR({sheetKeyRange})))"});
        //  Month
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.MONTH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW({sheetKeyRange})=1,\"{HeaderEnum.MONTH.DisplayName()}\",ISBLANK({sheetKeyRange}), \"\",true,MONTH({sheetKeyRange})&\"-\"&YEAR({sheetKeyRange})))"});

        return sheet;
    }
}