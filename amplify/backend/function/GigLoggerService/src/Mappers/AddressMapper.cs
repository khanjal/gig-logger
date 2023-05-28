using System.Collections.Generic;

public static class AddressMapper
{
    public static List<AddressEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var addresses = new List<AddressEntity>();
        var headers = new Dictionary<int, string>();
        var id = 0;

        foreach (var value in values)
        {
            id++;
            if (id == 1) {
                headers = HeaderParser.ParserHeader(value);
                continue;
            }

            if (value.Count < headers.Count) {
                continue;
            }

            AddressEntity address = new AddressEntity()
            {
                Id = id,
                Address = value[HeaderParser.GetHeaderKey(headers, "Address")].ToString(),
                Visits = value[HeaderParser.GetHeaderKey(headers, "Visits")].ToString(),
                Pay = value[HeaderParser.GetHeaderKey(headers, "Pay")].ToString(),
                Tip = value[HeaderParser.GetHeaderKey(headers, "Tip")].ToString(),
                Bonus = value[HeaderParser.GetHeaderKey(headers, "Bonus")].ToString(),
                Total = value[HeaderParser.GetHeaderKey(headers, "Total")].ToString(),
                Cash = value[HeaderParser.GetHeaderKey(headers, "Cash")].ToString(),
                Miles = value[HeaderParser.GetHeaderKey(headers, "Miles")].ToString(),
            };
            
            addresses.Add(address);
        }
        return addresses;
    }
}