import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { IPlace } from "@interfaces/place.interface";

export class PlaceHelper {
    
    static translateSheetData(rows: GoogleSpreadsheetRow[]): IPlace[] {
        let places: IPlace[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let place: IPlace = {} as IPlace;
            place.id = row.rowIndex;
            place.place = row['Place'];
            place.addresses = [];
            place.visits = row['Trips'];
            // console.log(placeModel);

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