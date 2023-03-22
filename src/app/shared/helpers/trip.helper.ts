import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { SiteModel } from "../models/site.model";
import { TripModel } from "../models/trip.model";
import { DateHelper } from "./date.helper";
import { LocalStorageHelper } from "./localStorage.helper";
import { NumberHelper } from "./number.helper";

export class TripHelper {
    static getPastTrips(days: number = 0):  TripModel[] {
        let trips = this.getRemoteTrips();

        let datestring = DateHelper.getDateString(days);

        let todaysTrips: TripModel[] = [];

        trips.forEach(trip => {
            if (new Date(trip.date) >= new Date(datestring)) {
                todaysTrips.push(trip);
            }
        });

        // console.log(trips);

        return todaysTrips;
    }

    static getRemoteTrips(): TripModel[] {
        let siteData: SiteModel = LocalStorageHelper.getSiteData();
        let trips: TripModel[] = [];

        if (siteData) {
            trips = siteData.remote.trips;
        }

        return trips;
    }

    static getLocalTrips():  TripModel[] {
        let siteData: SiteModel = LocalStorageHelper.getSiteData();
        let trips: TripModel[] = [];

        if (siteData) {
            trips = siteData.local.trips;
        }

        return trips;
    }

    static addTrip(trip: TripModel) {
        let trips = this.getLocalTrips();

        trips.push(trip);

        let gigs = LocalStorageHelper.getSiteData();

        gigs.local.trips = trips;

        LocalStorageHelper.updateLocalData(gigs);
    }

    static translateSheetData(rows: GoogleSpreadsheetRow[]): TripModel[] {
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
            tripModel.pay = NumberHelper.getNumberFromString(row['Pay']);
            tripModel.time = row['Pickup'];
            tripModel.place = row['Place'];
            tripModel.saved = true;
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

        return trips;
    }
}