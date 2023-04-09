import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { SiteModel } from "../models/site.model";
import { TripModel } from "../models/trip.model";
import { DateHelper } from "./date.helper";
import { NumberHelper } from "./number.helper";

export class TripHelper {
    static getAllTrips(): TripModel[] {
        let trips = [...this.getUnsavedLocalTrips(), ...this.getRemoteTrips()];
        return trips;
    }
    
    static getPastTrips(days: number = 0, trips?: TripModel[]): TripModel[] {
        if (!trips) {
            trips = [...this.getLocalTrips(), ...this.getRemoteTrips()];
        }

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
        let siteData: SiteModel = new SiteModel;
        let trips: TripModel[] = [];

        if (siteData) {
            trips = siteData.remote.trips;
        }

        return trips;
    }

    static getLocalTrips():  TripModel[] {
        let siteData: SiteModel = new SiteModel;
        let trips: TripModel[] = [];

        if (siteData) {
            trips = siteData.local.trips;
        }

        return trips;
    }

    static getSavedLocalTrips(): TripModel[] {
        let trips = this.getLocalTrips();

        return trips.filter(trip => trip.saved);
    }

    static getUnsavedLocalTrips(): TripModel[] {
        let trips = this.getLocalTrips();

        return trips.filter(trip => !trip.saved);
    }

    static addTrip(trip: TripModel) {
        let trips = this.getLocalTrips();

        trips.push(trip);

        // let gigs = LocalStorageHelper.getSiteData();
        // gigs.local.trips = trips;

        // LocalStorageHelper.updateLocalData(gigs);
    }

    static deleteTrip(trip: TripModel) {
        let trips = this.getLocalTrips();

        trips = trips.filter(x => x.id !== trip.id);

        // let gigs = LocalStorageHelper.getSiteData();
        // gigs.local.trips = trips;

        // LocalStorageHelper.updateLocalData(gigs);
    }

    static clearSavedTrips() {
        let trips = this.getLocalTrips();

        trips = trips.filter(x => !x.saved);

        // let gigs = LocalStorageHelper.getSiteData();
        // gigs.local.trips = trips;

        // LocalStorageHelper.updateLocalData(gigs);
    }

    static translateSheetData(rows: GoogleSpreadsheetRow[]): TripModel[] {
        let trips: TripModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let tripModel: TripModel = new TripModel;
            
            // Local
            tripModel.saved = "true";

            // Keys
            tripModel.id = row.rowIndex;
            tripModel.key = row['Key'];

            // Service
            tripModel.service = row['Service'];
            tripModel.number = row['#'];

            // Person
            tripModel.name = row['Name'];
            tripModel.endAddress = row['End Address'];
            
            tripModel.date = row['Date'];
            tripModel.time = row['Pickup'];
            tripModel.place = row['Place'];
            tripModel.distance = row['Distance'] ?? 0;
            
            // Amounts
            tripModel.pay = NumberHelper.getNumberFromString(row['Pay']);
            tripModel.tip = NumberHelper.getNumberFromString(row['Tip']);
            tripModel.bonus = NumberHelper.getNumberFromString(row['Bonus']);
            tripModel.total = NumberHelper.getNumberFromString(row['Total']);

            tripModel.note = row['Note'];

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