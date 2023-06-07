public class WeekdayEntity : AmountEntity
{
    public int Id { get; set; }
    public string Day { get; set; }
    public int Trips { get; set; }
    public decimal Miles { get; set; }
    public int Days { get; set; }
    public string Time { get; set; }
    public string DailyAverage { get; set; }
    public string PreviousDailyAverage { get; set; }
    public string CurrentAmount { get; set; }
    public string PreviousAmount { get; set; }
}