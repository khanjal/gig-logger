using System.Collections.Generic;

public static class TripMapper
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
    public static IList<IList<object>> MapToRangeData(List<TripEntity> trips, IList<object> tripHeaders)
    {
        var rangeData = new List<IList<object>>();

        foreach (var trip in trips)
        {
            var objectList = new List<object>();

            foreach (var header in tripHeaders)
            {
                switch (header.ToString())
                {
                    case "Date":
                        objectList.Add(trip.Date);
                        break;
                    case "Service":
                        objectList.Add(trip.Service);
                        break;
                    case "Number":
                        objectList.Add(trip.Number);
                        break;
                    case "Place":
                        objectList.Add(trip.Place);
                        break;
                    case "Pickup":
                        objectList.Add(trip.Pickup);
                        break;
                    case "Dropoff":
                        objectList.Add(trip.Dropoff);
                        break;
                    case "Duration":
                        objectList.Add(trip.Duration);
                        break;
                    case "Pay":
                        objectList.Add(trip.Pay);
                        break;
                    case "Tip":
                        objectList.Add(trip.Tip);
                        break;
                    case "Bonus":
                        objectList.Add(trip.Bonus);
                        break;
                    case "Cash":
                        objectList.Add(trip.Cash);
                        break;
                    case "Odo Start":
                        objectList.Add(trip.OdometerStart);
                        break;
                    case "Odo End":
                        objectList.Add(trip.OdometerEnd);
                        break;
                    case "Distance":
                        objectList.Add(trip.Distance);
                        break;
                    case "Name":
                        objectList.Add(trip.Name);
                        break;
                    case "Start Address":
                        objectList.Add(trip.StartAddress);
                        break;
                    case "End Address":
                        objectList.Add(trip.EndAddress);
                        break;
                    case "End Unit":
                        objectList.Add(trip.EndUnit);
                        break;
                    case "Order #":
                        objectList.Add(trip.OrderNumber);
                        break;
                    case "Note":
                        objectList.Add(trip.Note);
                        break;
                    default:
                        objectList.Add(null);
                        break;
                }   
            }

            rangeData.Add(objectList);
        }
        
        return rangeData;
    }
}