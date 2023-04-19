import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { TripModel } from "@models/trip.model";
import { NumberHelper } from "@helpers/number.helper";
import { ITrip } from "@interfaces/trip.interface";

export class TripHelper {
    static sortTripsDesc(trips: ITrip[]): ITrip[] {
        // trips.sort((a,b) => a.pickupTime.localeCompare(b.pickupTime) && a.date.localeCompare(b.date));
        trips.sort((a,b) => (b.id ?? 0) - (a.id ?? 0));

        return trips;
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
            tripModel.pickupTime = row['Pickup'];
            tripModel.place = row['Place'];
            tripModel.distance = NumberHelper.getNumberFromString(row['Distance']);
            
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