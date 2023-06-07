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
    public string DailyAverage { get; set; }

    [JsonPropertyName("dailyPrevAverage")]
    public string PreviousDailyAverage { get; set; }

    [JsonPropertyName("currentAmount")]
    public string CurrentAmount { get; set; }

    [JsonPropertyName("previousAmount")]
    public string PreviousAmount { get; set; }
}