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
                Address = HeaderParser.GetStringValue(HeaderEnum.Address.DisplayName(), value, headers),
                Visits = HeaderParser.GetIntValue(HeaderEnum.Visits.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.Pay.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.Tip.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.Bonus.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.Total.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.Cash.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.Distance.DisplayName(), value, headers),
            };
            
            addresses.Add(address);
        }
        return addresses;
    }
}