public class TripEntity : AmountEntity
{
    public int Id { get; set; }
    public string Key { get; set; }
    public string Date { get; set; }
    public string Service { get; set; }
    public string Number { get; set; }
    public string Place { get; set; }
    public string Pickup { get; set; }
    public string Dropoff { get; set; }
    public string Duration { get; set; }
    public string OdometerStart { get; set; }
    public string OdometerEnd { get; set; }
    public string Distance { get; set; }
    public string Name { get; set; }
    public string StartAddress { get; set; }
    public string EndAddress { get; set; }
    public string EndUnit { get; set; }
    public string OrderNumber { get; set; }
    public string Note { get; set; }
}