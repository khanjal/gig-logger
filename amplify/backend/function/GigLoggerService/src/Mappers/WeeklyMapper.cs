using System.Collections.Generic;

public static class WeeklyMapper
{

    public static SheetModel GetSheet() {
        var sheet = new SheetModel
        {
            Name = SheetEnum.WEEKLY.DisplayName(),
            TabColor = ColorEnum.LIGHT_GREEN,
            CellColor = ColorEnum.LIGHT_GRAY,
            FreezeColumnCount = 1,
            FreezeRowCount = 1,
            ProtectSheet = true
        };

        var dailySheet = DailyMapper.GetSheet();

        sheet.Headers = SheetHelper.GetCommonTripGroupSheetHeaders(dailySheet, HeaderEnum.WEEK);
        var sheetKeyRange = sheet.GetLocalRange(HeaderEnum.WEEK);

         // #
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.NUMBER.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW({sheetKeyRange})=1,\"{HeaderEnum.NUMBER.DisplayName()}\",ISBLANK({sheetKeyRange}), \"\",true,IFERROR(INDEX(SPLIT({sheetKeyRange}, \"-\"), 0,1), 0)))"});

        // Year
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.YEAR.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW({sheetKeyRange})=1,\"{HeaderEnum.YEAR.DisplayName()}\",ISBLANK({sheetKeyRange}), \"\",true,IFERROR(INDEX(SPLIT({sheetKeyRange}, \"-\"), 0,2), 0)))"});

         // Begin
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DATE_BEGIN.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW({sheetKeyRange})=1,\"{HeaderEnum.DATE_BEGIN.DisplayName()}\",ISBLANK({sheetKeyRange}), \"\",true,DATE({sheet.GetLocalRange(HeaderEnum.YEAR)},1,1)+(({sheet.GetLocalRange(HeaderEnum.NUMBER)}-1)*7)-WEEKDAY(DATE({sheet.GetLocalRange(HeaderEnum.YEAR)},1,1),3)))",
            Format = FormatEnum.DATE});
        
         // End
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DATE_END.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW({sheetKeyRange})=1,\"{HeaderEnum.DATE_END.DisplayName()}\",ISBLANK({sheetKeyRange}), \"\",true,DATE({sheet.GetLocalRange(HeaderEnum.YEAR)},1,7)+(({sheet.GetLocalRange(HeaderEnum.NUMBER)}-1)*7)-WEEKDAY(DATE({sheet.GetLocalRange(HeaderEnum.YEAR)},1,1),3)))",
            Format = FormatEnum.DATE});

        return sheet;
    }
}