using System.Collections.Generic;

public static class PlaceMapper
{
    public static List<PlaceEntity> MapFromRangeData(IList<IList<object>> values)
    {
        var places = new List<PlaceEntity>();
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

            PlaceEntity place = new()
            {
                Id = id,
                Place = HeaderParser.GetStringValue(HeaderEnum.PLACE.DisplayName(), value, headers),
                Trips = HeaderParser.GetIntValue(HeaderEnum.TRIPS.DisplayName(), value, headers),
                Pay = HeaderParser.GetDecimalValue(HeaderEnum.PAY.DisplayName(), value, headers),
                Tip = HeaderParser.GetDecimalValue(HeaderEnum.TIP.DisplayName(), value, headers),
                Bonus = HeaderParser.GetDecimalValue(HeaderEnum.BONUS.DisplayName(), value, headers),
                Total = HeaderParser.GetDecimalValue(HeaderEnum.TOTAL.DisplayName(), value, headers),
                Cash = HeaderParser.GetDecimalValue(HeaderEnum.CASH.DisplayName(), value, headers),
                Distance = HeaderParser.GetDecimalValue(HeaderEnum.DISTANCE.DisplayName(), value, headers),
            };
            
            places.Add(place);
        }

        return places;
    }

    public static SheetModel GetSheet() {
        var sheet = new SheetModel();
        sheet.Name = SheetEnum.PLACES.DisplayName();
        sheet.TabColor = ColorEnum.CYAN;
        sheet.CellColor = ColorEnum.LIGHT_CYAN;
        sheet.FreezeColumnCount = 1;
        sheet.FreezeRowCount = 1;
        sheet.ProtectSheet = true;

        var tripSheet = TripMapper.GetSheet();
        var sheetTripsName = SheetEnum.TRIPS.DisplayName();
        var sheetTripsPlaceRange = tripSheet.GetRange(HeaderEnum.PLACE, 2);

        sheet.Headers = new List<SheetCellModel>();

        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.PLACE.DisplayName(),
            Formula = "={\""+HeaderEnum.PLACE.DisplayName()+"\";SORT(UNIQUE("+sheetTripsPlaceRange+"))}"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.TRIPS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TRIPS.DisplayName()}\",ISBLANK($A:$A), \"\",true,COUNTIF({sheetTripsName}!E:E,$A:$A)))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.PAY.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.PAY.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({sheetTripsName}!E:E,$A:$A, {sheetTripsName}!I:I)))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.TIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TIP.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({sheetTripsName}!E:E,$A:$A, {sheetTripsName}!J:J)))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.BONUS.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.BONUS.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({sheetTripsName}!E:E,$A:$A, {sheetTripsName}!K:K)))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.TOTAL.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.TOTAL.DisplayName()}\",ISBLANK($A:$A), \"\",true,C1:C+D1:D+E1:E))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.CASH.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.CASH.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({sheetTripsName}!E:E,$A:$A, {sheetTripsName}!M:M)))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_TRIP.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_TRIP.DisplayName()}\",ISBLANK($A:$A), \"\", F:F = 0, 0,true,F:F/IF(B:B=0,1,B:B)))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\",true,SUMIF({sheetTripsName}!E:E,$A:$A, {sheetTripsName}!P:P)))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.AMOUNT_PER_DISTANCE.DisplayName()}\",ISBLANK($A:$A), \"\", H:H = 0, 0,true,F:F/IF(I:I=0,1,I:I)))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.VISIT_FIRST.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.VISIT_FIRST.DisplayName()}\",ISBLANK($A:$A), \"\",true,IFERROR(VLOOKUP($A:$A,SORT(QUERY({sheetTripsName}!A:E,\"SELECT E, A\"),2,true),2,0),\"\")))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.VISIT_LAST.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.VISIT_LAST.DisplayName()}\",ISBLANK($A:$A), \"\",true,IFERROR(VLOOKUP($A:$A,SORT(QUERY({sheetTripsName}!A:E,\"SELECT E, A\"),2,false),2,0),\"\")))"});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.DAYS_PER_VISIT.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.DAYS_PER_VISIT.DisplayName()}\",ISBLANK($A:$A), \"\", true, DAYS(K:K,J:J)/B:B))",
            Note = $"Average days between visits.{(char)10}{(char)10}Doesn't take into account active time vs all time."});
        sheet.Headers.Add(new SheetCellModel{Name = HeaderEnum.DAYS_SINCE_VISIT.DisplayName(),
            Formula = $"=ARRAYFORMULA(IFS(ROW($A:$A)=1,\"{HeaderEnum.DAYS_SINCE_VISIT.DisplayName()}\",ISBLANK($A:$A), \"\", true, DAYS(TODAY(),K:K)))",
            Note = "Days since last visit."});

        return sheet;
    }

}