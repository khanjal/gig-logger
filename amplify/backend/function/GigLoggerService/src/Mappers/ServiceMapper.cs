using System.Collections.Generic;

public static class ServiceMapper
{
    public static List<ServiceEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var services = new List<ServiceEntity>();
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

            ServiceEntity service = new()
            {
                Id = id,
                Service = HeaderParser.GetStringValue("Service", value, headers),
                Trips = HeaderParser.GetIntValue("Trips", value, headers),
                Pay = HeaderParser.GetDecimalValue("Pay", value, headers),
                Tip = HeaderParser.GetDecimalValue("Tip", value, headers),
                Bonus = HeaderParser.GetDecimalValue("Bonus", value, headers),
                Total = HeaderParser.GetDecimalValue("Total", value, headers),
                Cash = HeaderParser.GetDecimalValue("Cash", value, headers),
                Miles = HeaderParser.GetDecimalValue("Miles", value, headers),
            };
            
            services.Add(service);
        }
        return services;
    }
}