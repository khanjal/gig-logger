import { Injectable } from "@angular/core";
import { TripModel } from "src/app/models/trip.model";
import { DateHelper } from "../helpers/date.helper";
import { GoogleDriveService } from "./googleSheet.service";

const sheetName = "Trips";

@Injectable()
export class TripService {

    constructor(private _googleSheetService: GoogleDriveService) { }
        
    public async getTrips(): Promise<TripModel[]> {
        let trips: TripModel[] = [];
        let tripData = localStorage.getItem('trips') ?? '""';
        trips = JSON.parse(tripData);

        if (!trips) {
            await this.loadTrips();
            tripData = localStorage.getItem('trips') ?? "''";
            trips = JSON.parse(tripData);
        }

        // console.log(trips);

        return trips
    }

    public async getTodaysTrips():  Promise<TripModel[]> {
        let trips: TripModel[] = [];
        let tripData = localStorage.getItem('trips') ?? '""';
        trips = JSON.parse(tripData);

        if (!trips) {
            await this.loadTrips();
            tripData = localStorage.getItem('trips') ?? "''";
            trips = JSON.parse(tripData);
        }

        let datestring = DateHelper.getDateString(new Date());

        let todaysTrips: TripModel[] = [];

        trips.forEach(trip => {
            if (trip.date == datestring) {
                todaysTrips.push(trip);
            }
        });

        // console.log(trips);

        return todaysTrips;
    }

    public async addTrip(trip: TripModel) {
        let trips = await this.getTrips();

        trips.push(trip);

        localStorage.setItem('trips', JSON.stringify(trips));
    }

    public async loadTrips() {
        // Read trips sheet
        let sheet = await this._googleSheetService.getSheetDataByName(sheetName);

        console.log(sheet.title);
        console.log(sheet.rowCount);

        let rows = await sheet.getRows();
        let trips: TripModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let tripModel: TripModel = new TripModel;
            tripModel.id = row.rowIndex;
            tripModel.address = row['End Address'];
            tripModel.date = row['Date'];
            tripModel.key = row['Key'];
            tripModel.name = row['Name'];
            tripModel.amount = row['Pay'];
            tripModel.place = row['Place'];
            tripModel.service = row['Service'];
            tripModel.shiftNumber = row['#'];
            // console.log(trip);

            if (tripModel.date) {
                trips.push(tripModel);
            }
            
        });
        // console.log(trips);
        console.log(trips.length);
        // console.log(trips);

        // Load trips into storage
        localStorage.setItem('trips', JSON.stringify(trips));
    }
}