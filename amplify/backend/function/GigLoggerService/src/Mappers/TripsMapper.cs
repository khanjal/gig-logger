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

            if (value[0].ToString() == "") {
                continue;
            }

            TripEntity trip = new()
            {
                Id = id,
                Key = HeaderParser.GetValue("Key", value, headers),
                Date = HeaderParser.GetValue("Date", value, headers),
                Service = HeaderParser.GetValue("Service", value, headers),
                Number = HeaderParser.GetValue("#", value, headers),
                Place = HeaderParser.GetValue("Place", value, headers),
                Pickup = HeaderParser.GetValue("Pickup", value, headers),
                Dropoff = HeaderParser.GetValue("Dropoff", value, headers),
                Duration = HeaderParser.GetValue("Duration", value, headers),
                Pay = HeaderParser.GetValue("Pay", value, headers),
                Tip = HeaderParser.GetValue("Tip", value, headers),
                Bonus = HeaderParser.GetValue("Bonus", value, headers),
                Total = HeaderParser.GetValue("Total", value, headers),
                Cash = HeaderParser.GetValue("Cash", value, headers),
                OdometerStart = HeaderParser.GetValue("Odo Start", value, headers),
                OdometerEnd = HeaderParser.GetValue("Odo End", value, headers),
                Distance = HeaderParser.GetValue("Distance", value, headers),
                Name = HeaderParser.GetValue("Name", value, headers),
                StartAddress = HeaderParser.GetValue("Start Address", value, headers),
                EndAddress = HeaderParser.GetValue("End Address", value, headers),
                EndUnit = HeaderParser.GetValue("End Unit", value, headers),
                OrderNumber = HeaderParser.GetValue("Order #", value, headers),
                Note = HeaderParser.GetValue("Note", value, headers),
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