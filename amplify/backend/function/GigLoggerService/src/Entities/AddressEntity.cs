using System.Text.Json.Serialization;

public class AddressEntity : AmountEntity
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("address")]
    public string Address { get; set; }

    [JsonPropertyName("visits")]
    public string Visits { get; set; }

    [JsonPropertyName("distance")]
    public decimal Miles { get; set; }
}