using System;
using System.Collections.Generic;
using System.Text.Json;

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

            Console.Write(JsonSerializer.Serialize(value));

            TripEntity trip = new()
            {
                Id = id,
                Key = HeaderParser.GetStringValue("Key", value, headers),
                Date = HeaderParser.GetStringValue("Date", value, headers),
                Service = HeaderParser.GetStringValue("Service", value, headers),
                Number = HeaderParser.GetStringValue("#", value, headers),
                Place = HeaderParser.GetStringValue("Place", value, headers),
                Pickup = HeaderParser.GetStringValue("Pickup", value, headers),
                Dropoff = HeaderParser.GetStringValue("Dropoff", value, headers),
                Duration = HeaderParser.GetStringValue("Duration", value, headers),
                Pay = HeaderParser.GetDecimalValue("Pay", value, headers),
                Tip = HeaderParser.GetDecimalValue("Tip", value, headers),
                Bonus = HeaderParser.GetDecimalValue("Bonus", value, headers),
                Total = HeaderParser.GetDecimalValue("Total", value, headers),
                Cash = HeaderParser.GetDecimalValue("Cash", value, headers),
                OdometerStart = HeaderParser.GetStringValue("Odo Start", value, headers),
                OdometerEnd = HeaderParser.GetStringValue("Odo End", value, headers),
                Distance = HeaderParser.GetStringValue("Distance", value, headers),
                Name = HeaderParser.GetStringValue("Name", value, headers),
                StartAddress = HeaderParser.GetStringValue("Start Address", value, headers),
                EndAddress = HeaderParser.GetStringValue("End Address", value, headers),
                EndUnit = HeaderParser.GetStringValue("End Unit", value, headers),
                OrderNumber = HeaderParser.GetStringValue("Order #", value, headers),
                Note = HeaderParser.GetStringValue("Note", value, headers),
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