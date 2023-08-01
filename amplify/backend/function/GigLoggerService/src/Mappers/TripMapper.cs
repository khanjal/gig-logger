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
                Key = HeaderParser.GetStringValue(HeaderEnum.KEY.DisplayName(), value, headers),
                Date = HeaderParser.GetStringValue(HeaderEnum.DATE.DisplayName(), value, headers),
                Service = HeaderParser.GetStringValue(HeaderEnum.SERVICE.DisplayName(), value, headers),
                Number = HeaderParser.GetIntValue(HeaderEnum.NUMBER.DisplayName(), value, headers),
                Type = HeaderParser.GetStringValue(HeaderEnum.TYPE.DisplayName(), value, headers),
                Place = HeaderParser.GetStringValue(HeaderEnum.PLACE.DisplayName(), value, headers),
                Pickup = HeaderParser.GetStringValue(HeaderEnum.PICKUP.DisplayName(), value, headers),
                Dropoff = HeaderParser.GetStringValue(HeaderEnum.DROPOFF.DisplayName(), value, headers),
                Duration = HeaderParser.GetStringValue(HeaderEnum.DURATION.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.PAY.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.TIP.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.BONUS.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.CASH.DisplayName(), value, headers),
                OdometerStart = HeaderParser.GetDecimalValue(HeaderEnum.ODOMETER_START.DisplayName(), value, headers),
                OdometerEnd = HeaderParser.GetDecimalValue(HeaderEnum.ODOMETER_END.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.DISTANCE.DisplayName(), value, headers),
                Name = HeaderParser.GetStringValue(HeaderEnum.NAME.DisplayName(), value, headers),
                StartAddress = HeaderParser.GetStringValue(HeaderEnum.ADDRESS_START.DisplayName(), value, headers),
                EndAddress = HeaderParser.GetStringValue(HeaderEnum.ADDRESS_END.DisplayName(), value, headers),
                EndUnit = HeaderParser.GetStringValue(HeaderEnum.UNIT_END.DisplayName(), value, headers),
                OrderNumber = HeaderParser.GetStringValue(HeaderEnum.ORDER_NUMBER.DisplayName(), value, headers),
                Region = HeaderParser.GetStringValue(HeaderEnum.REGION.DisplayName(), value, headers),
                Note = HeaderParser.GetStringValue(HeaderEnum.NOTE.DisplayName(), value, headers),
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
                    case HeaderEnum.DATE:
                        objectList.Add(trip.Date);
                        break;
                    case HeaderEnum.KEY:
                        objectList.Add(trip.Service);
                        break;
                    case HeaderEnum.NUMBER:
                        objectList.Add(trip.Number);
                        break;
                    case HeaderEnum.TYPE:
                        objectList.Add(trip.Type);
                        break;
                    case HeaderEnum.PLACE:
                        objectList.Add(trip.Place);
                        break;
                    case HeaderEnum.PICKUP:
                        objectList.Add(trip.Pickup);
                        break;
                    case HeaderEnum.DROPOFF:
                        objectList.Add(trip.Dropoff);
                        break;
                    case HeaderEnum.DURATION:
                        objectList.Add(trip.Duration);
                        break;
                    case HeaderEnum.PAY:
                        objectList.Add(trip.Pay);
                        break;
                    case HeaderEnum.TIP:
                        objectList.Add(trip.Tip);
                        break;
                    case HeaderEnum.BONUS:
                        objectList.Add(trip.Bonus);
                        break;
                    case HeaderEnum.CASH:
                        objectList.Add(trip.Cash);
                        break;
                    case HeaderEnum.ODOMETER_START:
                        objectList.Add(trip.OdometerStart);
                        break;
                    case HeaderEnum.ODOMETER_END:
                        objectList.Add(trip.OdometerEnd);
                        break;
                    case HeaderEnum.DISTANCE:
                        objectList.Add(trip.Distance);
                        break;
                    case HeaderEnum.NAME:
                        objectList.Add(trip.Name);
                        break;
                    case HeaderEnum.ADDRESS_START:
                        objectList.Add(trip.StartAddress);
                        break;
                    case HeaderEnum.ADDRESS_END:
                        objectList.Add(trip.EndAddress);
                        break;
                    case HeaderEnum.UNIT_END:
                        objectList.Add(trip.EndUnit);
                        break;
                    case HeaderEnum.ORDER_NUMBER:
                        objectList.Add(trip.OrderNumber);
                        break;
                    // case "Region":
                    //     objectList.Add(trip.Region);
                    //     break;
                    case HeaderEnum.NOTE:
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

    public static SheetModel GetSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.TRIPS.DisplayName();
        sheet.TabColor = ColorEnum.RED;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;

        sheet.Headers = new List<SheetCellModel>();

        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DATE.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.SERVICE.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.NUMBER.DisplayName(),
            Note = "Shift Number 1-9 Leave blank if there is only shift for that service for that day."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TYPE.DisplayName(),
            Note = "Pickup, Shop, Order, Curbside, Canceled"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.PLACE.DisplayName(),
            Note = "Location of pickup (delivery)."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.PICKUP.DisplayName(),
            Note = "Time when request/ride picked up."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DROPOFF.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DURATION.DisplayName(),
            Note = "Minutes task took to complete."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.PAY.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TIP.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.BONUS.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.TOTAL.DisplayName(), 
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.TOTAL.DisplayName()}\",ISBLANK(A1:A), \"\",true,IF(ISBLANK(A1:A), \"\",I1:I+J1:J+K1:K)))"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.CASH.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.ODOMETER_START.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.ODOMETER_END.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Note = "How many miles/km the request took."});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.NAME.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.ADDRESS_START.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.ADDRESS_END.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.UNIT_END.DisplayName(),
            Note = "Apartment, Unit, Room, Suite"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.ORDER_NUMBER.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.NOTE.DisplayName()});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.REGION.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.REGION.DisplayName()}\",ISBLANK($A:$A), \"\",true,IFERROR(VLOOKUP($X:$X,SORT(QUERY({SheetEnum.SHIFTS.DisplayName()}!O:AG,\"SELECT AG, O\"),2,true),2,0),\"\")))"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.KEY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.KEY.DisplayName()}\",ISBLANK(B1:B), \"\",true,IF(ISBLANK(C1:C), A1:A & \"-0-\" & B1:B, A1:A & \"-\" & C1:C & \"-\" & B1:B)))"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.DAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.DAY.DisplayName()}\",ISBLANK(A1:A), \"\",true,DAY(A:A)))"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.MONTH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.MONTH.DisplayName()}\",ISBLANK(A1:A), \"\",true,MONTH(A:A)))"});
        sheet.Headers.AddColumn(new SheetCellModel{Name = HeaderEnum.YEAR.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW(A1:A)=1,\"{HeaderEnum.YEAR.DisplayName()}\",ISBLANK(A1:A), \"\",true,YEAR(A:A)))"});

        return sheet;
    }
}