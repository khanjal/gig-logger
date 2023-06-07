public class ServiceEntity : AmountEntity
{
    public int Id { get; set; }
    public string Service { get; set; }
    public int Trips { get; set; }
    public decimal Miles { get; set; }
}