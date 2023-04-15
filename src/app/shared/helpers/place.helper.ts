import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { PlaceModel } from "../models/place.model";

export class PlaceHelper {
    
    static translateSheetData(rows: GoogleSpreadsheetRow[]): PlaceModel[] {
        let places: PlaceModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let placeModel: PlaceModel = new PlaceModel;
            placeModel.id = row.rowIndex;
            placeModel.place = row['Place'];
            placeModel.visits = row['Trips'];
            // console.log(placeModel);

            if (placeModel.place) {
                places.push(placeModel);
            }
            
        });
        // console.log(places);
        console.log(places.length);
        // console.log(places);

        return places;
    }
}