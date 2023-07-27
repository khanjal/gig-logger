using System.Collections.Generic;

public class SheetModel {
    public string Name { get; set; }
    public List<SheetHeaderModel> Headers { get; set; }
    public ColorEnum TabColor { get; set; }
    public bool ProtectSheet { get; set; }
    public int FreezeColumnCount { get; set;}
    public int FreezeRowCount { get; set; }
}