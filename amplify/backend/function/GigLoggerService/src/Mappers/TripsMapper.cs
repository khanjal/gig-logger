using System.Collections.Generic;

public static class TripsMapper
{
    public static List<Trip> MapFromRangeData(IList<IList<object>> values)
    {
        var trips = new List<Trip>();
        var id = 1;
        foreach (var value in values)
        {
            if (id == 1) {
                id++;
                continue;
            }

            Trip trip = new()
            {
                Id = id,
                Key = value[22].ToString(),
                Date = value[0].ToString(),
                Service = value[1].ToString(),
                Number = value[2].ToString(),
                Place = value[4].ToString(),
                Pickup = value[5].ToString(),
                Dropoff = value[6].ToString(),
                Duration = value[7].ToString(),
                Pay = value[8].ToString(),
                Tip = value[9].ToString(),
                Bonus = value[10].ToString(),
                Total = value[11].ToString(),
                Cash = value[12].ToString(),
                OdometerStart = value[13].ToString(),
                OdometerEnd = value[14].ToString(),
                Distance = value[15].ToString(),
                Name = value[16].ToString(),
                StartAddress = value[17].ToString(),
                EndAddress = value[18].ToString(),
                EndUnit = value[19].ToString(),
                OrderNumber = value[20].ToString(),
                Note = value[21].ToString(),
            };
            
            trips.Add(trip);
            id++;
        }
        return trips;
    }
    public static IList<IList<object>> MapToRangeData(Trip trip)
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