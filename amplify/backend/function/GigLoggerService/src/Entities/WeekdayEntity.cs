using System.Text.Json.Serialization;

public class WeekdayEntity : AmountEntity
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("day")]
    public string Day { get; set; }

    [JsonPropertyName("trips")]
    public int Trips { get; set; }

    [JsonPropertyName("distance")]
    public decimal Miles { get; set; }

    [JsonPropertyName("days")]
    public int Days { get; set; }

    [JsonPropertyName("time")]
    public string Time { get; set; }

    [JsonPropertyName("dailyAverage")]
    public decimal DailyAverage { get; set; }

    [JsonPropertyName("dailyPrevAverage")]
    public decimal PreviousDailyAverage { get; set; }

    [JsonPropertyName("currentAmount")]
    public decimal CurrentAmount { get; set; }

    [JsonPropertyName("previousAmount")]
    public decimal PreviousAmount { get; set; }
}