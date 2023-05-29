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

            if (value[0].ToString() == "") {
                continue;
            }

            AddressEntity address = new AddressEntity()
            {
                Id = id,
                Address = HeaderParser.GetValue("Address", value, headers),
                Visits = HeaderParser.GetValue("Visits", value, headers),
                Pay = HeaderParser.GetValue("Pay", value, headers),
                Tip = HeaderParser.GetValue("Tip", value, headers),
                Bonus = HeaderParser.GetValue("Bonus", value, headers),
                Total = HeaderParser.GetValue("Total", value, headers),
                Cash = HeaderParser.GetValue("Cash", value, headers),
                Miles = HeaderParser.GetValue("Miles", value, headers),
            };
            
            addresses.Add(address);
        }
        return addresses;
    }
}