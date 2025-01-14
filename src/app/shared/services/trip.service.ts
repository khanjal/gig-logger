import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ITrip } from '@interfaces/trip.interface';
import { DateHelper } from '@helpers/date.helper';

export class TripService {
    trips$ = liveQuery(() => spreadsheetDB.trips.toArray());
    
    public async addTrip(trip: ITrip) {
        await spreadsheetDB.trips.add(trip);
    }

    public async deleteTrip(tripId: number) {
        await spreadsheetDB.trips.delete(tripId);
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
}