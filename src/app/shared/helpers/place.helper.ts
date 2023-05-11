import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { IPlace } from "@interfaces/place.interface";
import { NumberHelper } from "./number.helper";

export class PlaceHelper {
    
    static translateSheetData(rows: GoogleSpreadsheetRow[]): IPlace[] {
        let places: IPlace[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let place: IPlace = {} as IPlace;
            place.id = row.rowIndex;
            place.addresses = [];
            place.place = row['Place'];
            place.visits = row['Trips'];
            // console.log(placeModel);

            place.bonus = NumberHelper.getNumberFromString(row['Bonus']);
            place.cash = NumberHelper.getNumberFromString(row['Cash']);
            place.pay = NumberHelper.getNumberFromString(row['Pay']);
            place.tip = NumberHelper.getNumberFromString(row['Tip']);
            place.total = NumberHelper.getNumberFromString(row['Total']);

            if (place.place) {
                places.push(place);
            }
            
        });
        // console.log(places);
        console.log(places.length);
        // console.log(places);

        return places;
    }
}