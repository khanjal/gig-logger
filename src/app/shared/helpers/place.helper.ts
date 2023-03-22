import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { PlaceModel } from "../models/place.model";
import { SiteModel } from "../models/site.model";
import { LocalStorageHelper } from "./localStorage.helper";

export class PlaceHelper {
    static getRemotePlaces(): PlaceModel[] {
        let siteData: SiteModel = LocalStorageHelper.getSiteData();
        let places: PlaceModel[] = [];

        if (siteData) {
            places = siteData.remote.places;
        }

        return places;
    }

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