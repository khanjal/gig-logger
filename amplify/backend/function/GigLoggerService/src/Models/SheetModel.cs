using System.Collections.Generic;

public class SheetModel {
    public string Name { get; set; }
    public List<SheetHeaderModel> Headers { get; set; }
    public ColorEnum TabColor { get; set; }
}