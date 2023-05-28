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

            if (value.Count < headers.Count) {
                continue;
            }

            ServiceEntity service = new()
            {
                Id = id,
                Service = value[HeaderParser.GetHeaderKey(headers, "Place")].ToString(),
                Trips = value[HeaderParser.GetHeaderKey(headers, "Trips")].ToString(),
                Pay = value[HeaderParser.GetHeaderKey(headers, "Pay")].ToString(),
                Tip = value[HeaderParser.GetHeaderKey(headers, "Tip")].ToString(),
                Bonus = value[HeaderParser.GetHeaderKey(headers, "Bonus")].ToString(),
                Total = value[HeaderParser.GetHeaderKey(headers, "Total")].ToString(),
                Cash = value[HeaderParser.GetHeaderKey(headers, "Cash")].ToString(),
                Miles = value[HeaderParser.GetHeaderKey(headers, "Miles")].ToString(),
            };
            
            services.Add(service);
        }
        return services;
    }
}