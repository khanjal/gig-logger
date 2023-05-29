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
                Service = HeaderParser.GetValue("Service", value, headers),
                Trips = HeaderParser.GetValue("Trips", value, headers),
                Pay = HeaderParser.GetValue("Pay", value, headers),
                Tip = HeaderParser.GetValue("Tip", value, headers),
                Bonus = HeaderParser.GetValue("Bonus", value, headers),
                Total = HeaderParser.GetValue("Total", value, headers),
                Cash = HeaderParser.GetValue("Cash", value, headers),
                Miles = HeaderParser.GetValue("Miles", value, headers),
            };
            
            services.Add(service);
        }
        return services;
    }
}