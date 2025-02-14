import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ITrip } from '@interfaces/trip.interface';
import { DateHelper } from '@helpers/date.helper';
import { max } from 'rxjs';
import { ActionEnum } from '@enums/action.enum'; // Adjust the import path as necessary

export class TripService {
    trips$ = liveQuery(() => spreadsheetDB.trips.toArray());
    
    public async addTrip(trip: ITrip) {
        await spreadsheetDB.trips.add(trip);
    }

    public async deleteTrip(tripId: number) {
        await spreadsheetDB.trips.delete(tripId);
    }

    public async getMaxTripId(): Promise<number> {
        return await spreadsheetDB.trips.orderBy("rowId").last().then(x => x?.rowId || 2);
    }

    public async getTrips(): Promise<ITrip[]> {
        return await spreadsheetDB.trips.toArray();
    }

    public async getSavedTrips(): Promise<ITrip[]> {
        return (await this.getTrips()).filter(x => x.saved);
    }

    public async getUnsavedTrips(): Promise<ITrip[]> {
        return (await this.getTrips()).filter(x => !x.saved);
    }

    public async getTripsBetweenDates(startDate: string, endDate: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").between(startDate, endDate, true, true).toArray();

        return trips;
    }

    public async getTripsPreviousDays(days: number): Promise<ITrip[]> {
        let date = DateHelper.getISOFormat(DateHelper.getDateFromDays(days));
        let trips = await spreadsheetDB.trips.where("date").aboveOrEqual(date).toArray();

        return trips;
    }

    public async getTripsPreviousDate(date: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").aboveOrEqual(date).toArray();

        return trips;
    }

    public async queryTrips(field: string, value: string | number): Promise<ITrip[]> {
        return await spreadsheetDB.trips.where(field).equals(value).toArray();
    }

    public async saveUnsavedTrips() {
        let trips = await this.getUnsavedTrips();
        for (let trip of trips) {
            trip.action = ActionEnum.Saved;
            trip.saved = true;
            await this.updateTrip(trip);
        };
    }

    public async loadTrips(trips: ITrip[]) {
        await spreadsheetDB.trips.clear();
        await spreadsheetDB.trips.bulkAdd(trips);
    }

    public async updateTrip(trip: ITrip) {
        await spreadsheetDB.trips.put(trip);
    }

    public async updateTripRowIds(rowId: number) {
        let maxId = await this.getMaxTripId();
        let nextRowId = rowId + 1;
        
        // Need to loop id until it finds a trip. Update that trip with a current row id. Then continue until it hits maxId
        while (nextRowId <= maxId) {
            let trip = await spreadsheetDB.trips.where("rowId").equals(nextRowId).first();
            if (trip) {
                trip.rowId = rowId;
                await this.updateTrip(trip);
                rowId++;
            }
            nextRowId++;
        }
    }
}