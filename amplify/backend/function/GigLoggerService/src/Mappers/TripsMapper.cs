using System.Collections.Generic;

public static class TripsMapper
{
    public static List<TripEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var trips = new List<TripEntity>();
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

            TripEntity trip = new()
            {
                Id = id,
                Key = value[HeaderParser.GetHeaderKey(headers, "Key")].ToString(),
                Date = value[HeaderParser.GetHeaderKey(headers, "Date")].ToString(),
                Service = value[HeaderParser.GetHeaderKey(headers, "Service")].ToString(),
                Number = value[HeaderParser.GetHeaderKey(headers, "#")].ToString(),
                Place = value[HeaderParser.GetHeaderKey(headers, "Place")].ToString(),
                Pickup = value[HeaderParser.GetHeaderKey(headers, "Pickup")].ToString(),
                Dropoff = value[HeaderParser.GetHeaderKey(headers, "Dropoff")].ToString(),
                Duration = value[HeaderParser.GetHeaderKey(headers, "Duration")].ToString(),
                Pay = value[HeaderParser.GetHeaderKey(headers, "Pay")].ToString(),
                Tip = value[HeaderParser.GetHeaderKey(headers, "Tip")].ToString(),
                Bonus = value[HeaderParser.GetHeaderKey(headers, "Bonus")].ToString(),
                Total = value[HeaderParser.GetHeaderKey(headers, "Total")].ToString(),
                Cash = value[HeaderParser.GetHeaderKey(headers, "Cash")].ToString(),
                OdometerStart = value[HeaderParser.GetHeaderKey(headers, "Odo Start")].ToString(),
                OdometerEnd = value[HeaderParser.GetHeaderKey(headers, "Odo End")].ToString(),
                Distance = value[HeaderParser.GetHeaderKey(headers, "Distance")].ToString(),
                Name = value[HeaderParser.GetHeaderKey(headers, "Name")].ToString(),
                StartAddress = value[HeaderParser.GetHeaderKey(headers, "Start Address")].ToString(),
                EndAddress = value[HeaderParser.GetHeaderKey(headers, "End Address")].ToString(),
                EndUnit = value[HeaderParser.GetHeaderKey(headers, "EndUnit")].ToString(),
                OrderNumber = value[HeaderParser.GetHeaderKey(headers, "Order #")].ToString(),
                Note = value[HeaderParser.GetHeaderKey(headers, "Note")].ToString(),
            };
            
            trips.Add(trip);
        }
        return trips;
    }
    public static IList<IList<object>> MapToRangeData(TripEntity trip)
    {
        var objectList = new List<object>() { 
            trip.Date, 
            trip.Service, 
            trip.Number, 
            "",
            trip.Place,
            trip.Pickup,
            trip.Dropoff,
            trip.Duration,
            trip.Pay,
            trip.Tip,
            trip.Bonus,
            "",
            trip.Cash,
            trip.OdometerStart,
            trip.OdometerEnd,
            trip.Distance,
            trip.Name,
            trip.StartAddress,
            trip.EndAddress,
            trip.EndUnit,
            trip.OrderNumber,
            trip.Note
        };

        var rangeData = new List<IList<object>> { objectList };
        return rangeData;
    }
}