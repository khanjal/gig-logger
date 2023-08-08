using System.Collections.Generic;
using Google.Apis.Sheets.v4.Data;

public static class SheetHelper {

    public static string ArrayFormulaCountIf() {
        return "=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{0}\",ISBLANK($A:$A), \"\",true,COUNTIF({1},$A:$A)))";
    }

    public static string ArrayFormulaSumIf() {
        return "=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{0}\",ISBLANK($A:$A), \"\",true,SUMIF({1},$A:$A, {2})))";
    }

    public static string ArrayFormulaVisit(string headerText, string referenceSheet, string columnStart, string columnEnd, bool first) {
        return $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{headerText}\",ISBLANK($A:$A), \"\", true, IFERROR(VLOOKUP($A:$A,SORT(QUERY({referenceSheet}!{columnStart}:{columnEnd},\"SELECT {columnEnd}, {columnStart}\"),2,{first}),2,0),\"\")))";
    }

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
            case ColorEnum.CYAN:
                return new Color{ Red = (float?)0.3, Green = (float?)0.8, Blue = (float?)0.9 };
            case ColorEnum.DARK_YELLOW:
                return new Color{ Red = (float?)0.9686274509803922, Green = (float?)0.796078431372549, Blue = (float?)0.30196078431372547 };
            case ColorEnum.GREEN:
                return new Color{ Red = 0, Green = (float?)0.5, Blue = 0 };
            case ColorEnum.LIGHT_CYAN:
                return new Color{ Red = (float?)0.9, Green = (float?)1, Blue = (float?)1 };
            case ColorEnum.LIGHT_RED:
                return new Color{ Red = (float?)1, Green = (float?)0.9, Blue = (float?)0.85 };
            case ColorEnum.LIGHT_YELLOW:
                return new Color{ Red = (float?)0.996078431372549, Green = (float?)0.9725490196078431, Blue = (float?)0.8901960784313725 };
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
            cell.UserEnteredFormat = new CellFormat {
                TextFormat = new TextFormat {
                    Bold = true
                }
            };

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

    // https://developers.google.com/sheets/api/guides/formats
    public static CellFormat GetCellFormat(FormatEnum format) {
        var cellFormat = new CellFormat();

        switch (format)
        {
            case FormatEnum.ACCOUNTING:
                cellFormat.NumberFormat = new NumberFormat { Type = "NUMBER", Pattern = "#,##0.00" };
                break;
            case FormatEnum.DATE:
                cellFormat.NumberFormat = new NumberFormat { Type = "DATE", Pattern = "mm/dd/yyyy" };
                break;
            case FormatEnum.DURATION:
                cellFormat.NumberFormat = new NumberFormat { Type = "DATE", Pattern = "[h]:mm" };
                break;
            case FormatEnum.NUMBER:
                cellFormat.NumberFormat = new NumberFormat { Type = "NUMBER", Pattern = "#,##0" };
                break;
            case FormatEnum.TIME:
                cellFormat.NumberFormat = new NumberFormat { Type = "DATE", Pattern = "hh:mm:ss am/pm" };
                break;
            default:
                break;
        }

        return cellFormat;
    }
}