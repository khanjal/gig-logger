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

        return sheet;
    }
}