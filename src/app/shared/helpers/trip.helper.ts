import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { NumberHelper } from "@helpers/number.helper";
import { ITrip } from "@interfaces/trip.interface";

export class TripHelper {
    static sortTripsDesc(trips: ITrip[]): ITrip[] {
        // trips.sort((a,b) => a.pickupTime.localeCompare(b.pickupTime) && a.date.localeCompare(b.date));
        trips.sort((a,b) => (b.id ?? 0) - (a.id ?? 0));

        return trips;
    }

    static translateSheetData(rows: GoogleSpreadsheetRow[]): ITrip[] {
        let trips: ITrip[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let trip: ITrip = {} as ITrip;
            
            // Local
            trip.saved = true;

            // Keys
            trip.id = row.rowIndex;
            trip.key = row['Key'];

            // Service
            trip.service = row['Service'];
            trip.number = row['#'];

            // Person
            trip.name = row['Name'].trim();
            trip.startAddress = row['Start Address'].trim();
            trip.endAddress = row['End Address'].trim();
            
            trip.date = row['Date'];
            trip.pickupTime = row['Pickup'];
            trip.dropoffTime = row['Dropoff'];
            trip.place = row['Place'];
            trip.distance = NumberHelper.getNumberFromString(row['Distance']);
            
            // Amounts
            trip.pay = NumberHelper.getNumberFromString(row['Pay']);
            trip.tip = NumberHelper.getNumberFromString(row['Tip']);
            trip.bonus = NumberHelper.getNumberFromString(row['Bonus']);
            trip.total = NumberHelper.getNumberFromString(row['Total']);
            trip.cash = NumberHelper.getNumberFromString(row['Cash']);

            // Odometers
            trip.startOdometer = NumberHelper.getNumberFromString(row['Odo Start']);
            trip.endOdometer = NumberHelper.getNumberFromString(row['Odo End']);

            trip.note = row['Note'];

            // Other
            trip.endUnit = row['End Unit'];
            trip.orderNumber = row['Order #'];

            // console.log(trip);

            if (trip.date) {
                trips.push(trip);
            }
            
        });
        // console.log(trips);
        console.log(trips.length);
        // console.log(trips);

        return trips;
    }
}