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

            // Console.Write(JsonSerializer.Serialize(value));
            TripEntity trip = new()
            {
                Id = id,
                Key = HeaderParser.GetStringValue(HeaderEnum.Key.DisplayName(), value, headers),
                Date = HeaderParser.GetStringValue(HeaderEnum.Date.DisplayName(), value, headers),
                Service = HeaderParser.GetStringValue(HeaderEnum.Service.DisplayName(), value, headers),
                Number = HeaderParser.GetIntValue(HeaderEnum.Number.DisplayName(), value, headers),
                Type = HeaderParser.GetStringValue(HeaderEnum.Type.DisplayName(), value, headers),
                Place = HeaderParser.GetStringValue(HeaderEnum.Place.DisplayName(), value, headers),
                Pickup = HeaderParser.GetStringValue(HeaderEnum.Pickup.DisplayName(), value, headers),
                Dropoff = HeaderParser.GetStringValue(HeaderEnum.Dropoff.DisplayName(), value, headers),
                Duration = HeaderParser.GetStringValue(HeaderEnum.Duration.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.Pay.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.Tip.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.Bonus.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.Total.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.Cash.DisplayName(), value, headers),
                OdometerStart = HeaderParser.GetDecimalValue(HeaderEnum.OdometerStart.DisplayName(), value, headers),
                OdometerEnd = HeaderParser.GetDecimalValue(HeaderEnum.OdometerEnd.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.Distance.DisplayName(), value, headers),
                Name = HeaderParser.GetStringValue(HeaderEnum.Name.DisplayName(), value, headers),
                StartAddress = HeaderParser.GetStringValue(HeaderEnum.AddressStart.DisplayName(), value, headers),
                EndAddress = HeaderParser.GetStringValue(HeaderEnum.AddressEnd.DisplayName(), value, headers),
                EndUnit = HeaderParser.GetStringValue(HeaderEnum.UnitEnd.DisplayName(), value, headers),
                OrderNumber = HeaderParser.GetStringValue(HeaderEnum.OrderNumber.DisplayName(), value, headers),
                Region = HeaderParser.GetStringValue(HeaderEnum.Region.DisplayName(), value, headers),
                Note = HeaderParser.GetStringValue(HeaderEnum.Note.DisplayName(), value, headers),
                Saved = true
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
                var headerEnum = header.ToString().Trim().GetValueFromName<HeaderEnum>();

                switch (headerEnum)
                {
                    case HeaderEnum.Date:
                        objectList.Add(trip.Date);
                        break;
                    case HeaderEnum.Key:
                        objectList.Add(trip.Service);
                        break;
                    case HeaderEnum.Number:
                        objectList.Add(trip.Number);
                        break;
                    case HeaderEnum.Type:
                        objectList.Add(trip.Type);
                        break;
                    case HeaderEnum.Place:
                        objectList.Add(trip.Place);
                        break;
                    case HeaderEnum.Pickup:
                        objectList.Add(trip.Pickup);
                        break;
                    case HeaderEnum.Dropoff:
                        objectList.Add(trip.Dropoff);
                        break;
                    case HeaderEnum.Duration:
                        objectList.Add(trip.Duration);
                        break;
                    case HeaderEnum.Pay:
                        objectList.Add(trip.Pay);
                        break;
                    case HeaderEnum.Tip:
                        objectList.Add(trip.Tip);
                        break;
                    case HeaderEnum.Bonus:
                        objectList.Add(trip.Bonus);
                        break;
                    case HeaderEnum.Cash:
                        objectList.Add(trip.Cash);
                        break;
                    case HeaderEnum.OdometerStart:
                        objectList.Add(trip.OdometerStart);
                        break;
                    case HeaderEnum.OdometerEnd:
                        objectList.Add(trip.OdometerEnd);
                        break;
                    case HeaderEnum.Distance:
                        objectList.Add(trip.Distance);
                        break;
                    case HeaderEnum.Name:
                        objectList.Add(trip.Name);
                        break;
                    case HeaderEnum.AddressStart:
                        objectList.Add(trip.StartAddress);
                        break;
                    case HeaderEnum.AddressEnd:
                        objectList.Add(trip.EndAddress);
                        break;
                    case HeaderEnum.UnitEnd:
                        objectList.Add(trip.EndUnit);
                        break;
                    case HeaderEnum.OrderNumber:
                        objectList.Add(trip.OrderNumber);
                        break;
                    // case "Region":
                    //     objectList.Add(trip.Region);
                    //     break;
                    case HeaderEnum.Note:
                        objectList.Add(trip.Note);
                        break;
                    default:
                        objectList.Add(null);
                        break;
                }   
            }

            rangeData.Add(objectList);
        }
        Console.Write(JsonSerializer.Serialize(rangeData));
        return rangeData;
    }
}