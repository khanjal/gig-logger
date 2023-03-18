import { Injectable } from "@angular/core";
import { PlaceModel } from "src/app/shared/models/place.model";
import { GoogleDriveService } from "./googleSheet.service";

const sheetName = "Places";

@Injectable()
export class PlaceService {

    constructor(private _googleSheetService: GoogleDriveService) { }
    
    public async getPlaces(): Promise<PlaceModel[]> {
        let places: PlaceModel[] = [];
        let placeData = localStorage.getItem('places') ?? '""';
        places = JSON.parse(placeData);
    
        if (!places) {
            await this.loadPlaces();
            placeData = localStorage.getItem('places') ?? "''";
            places = JSON.parse(placeData);
        }
    
        // console.log(places);

        return places;
    }

    public async loadPlaces() {
        let sheet = await this._googleSheetService.getSheetDataByName(sheetName);

        console.log(sheet.title);
        console.log(sheet.rowCount);

        let rows = await sheet.getRows();
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

        // Load places into storage
        localStorage.setItem('places', JSON.stringify(places));
    }
}