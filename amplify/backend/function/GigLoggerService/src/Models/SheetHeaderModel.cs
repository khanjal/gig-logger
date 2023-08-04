public class SheetCellModel {
    public string Name { get; set; }
    public int Index { get; set; }
    public string Column { get; set; }
    public string Range { get; set; }
    public string Formula { get; set; }
    public FormatEnum? Format { get; set; }
    public bool Border { get; set; }
    public string Note { get; set; }
}