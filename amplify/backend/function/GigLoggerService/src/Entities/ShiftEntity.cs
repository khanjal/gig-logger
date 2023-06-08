using System.Text.Json.Serialization;

public class ShiftEntity : AmountEntity
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("key")]
    public string Key { get; set; }

    [JsonPropertyName("date")]
    public string Date { get; set; }

    [JsonPropertyName("start")]
    public string Start { get; set; }

    [JsonPropertyName("end")]
    public string End { get; set; }

    [JsonPropertyName("service")]
    public string Service { get; set; }

    [JsonPropertyName("number")]
    public int Number { get; set; }

    [JsonPropertyName("active")]
    public string Active { get; set; }

    [JsonPropertyName("trips")]
    public int Trips { get; set; }

    [JsonPropertyName("time")]
    public string Time { get; set; }

    [JsonPropertyName("omit")]
    public string Omit { get; set; }

    [JsonPropertyName("note")]
    public string Note { get; set; }
    
    [JsonPropertyName("saved")]
    public bool Saved { get; set; }
}