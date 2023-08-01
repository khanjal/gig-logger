using System.Collections.Generic;
using Google.Apis.Sheets.v4.Data;

public static class SheetHelper {
    public static List<SheetModel> GetSheets() {
        var sheets = new List<SheetModel>();
        
        sheets.Add(TripMapper.GetSheet());
        sheets.Add(ShiftMapper.GetSheet());

        return sheets;
    }

    // https://www.rapidtables.com/convert/color/hex-to-rgb.html
    public static Color GetColor(ColorEnum colorEnum) {
        switch (colorEnum)
        {
            case ColorEnum.BLACK:
                return new Color{ Red = 0, Green = 0, Blue = 0 };
            case ColorEnum.BLUE:
                return new Color{ Red = 0, Green = 0, Blue = 1 };
            case ColorEnum.GREEN:
                return new Color{ Red = 0, Green = (float?)0.5, Blue = 0 };
            case ColorEnum.LIME:
                return new Color{ Red = 0, Green = 1, Blue = 0 };
            case ColorEnum.ORANGE:
                return new Color{ Red = 1, Green = (float?)0.6, Blue = 0 };
            case ColorEnum.MAGENTA:
            case ColorEnum.PINK:
                return new Color{ Red = 1, Green = 0, Blue = 1 };
            case ColorEnum.PURPLE:
                return new Color{ Red = (float?)0.5, Green = 0, Blue = (float?)0.5 };
            case ColorEnum.RED:
                return new Color{ Red = 1, Green = 0, Blue = 0 };
            case ColorEnum.WHITE:
                return new Color{ Red = 1, Green = 1, Blue = 1 };
            case ColorEnum.YELLOW:
                return new Color{ Red = 1, Green = 1, Blue = 0 };
            default:
                return null;
        }
    }

    public static string GetColumnName(int index)
    {
        const string letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        var value = "";

        if (index >= letters.Length)
            value += letters[index / letters.Length - 1];

        value += letters[index % letters.Length];

        return value;
    }

    public static IList<IList<object>> HeadersToList(List<SheetCellModel> headers)
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