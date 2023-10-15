import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ITrip } from '@interfaces/trip.interface';
import { localDB } from '@data/local.db';
import { DateHelper } from '@helpers/date.helper';

export class TripService {
    trips$ = liveQuery(() => spreadsheetDB.trips.toArray());
    
    public async addTrip(trip: ITrip) {
        await localDB.trips.add(trip);
    }

    public async deleteLocal(tripId: number) {
        await localDB.trips.delete(tripId);
    }

    public async getLocalTrips(): Promise<ITrip[]> {
        return await localDB.trips.toArray();
    }

    public async getSavedLocalTrips(): Promise<ITrip[]> {
        return (await this.getLocalTrips()).filter(x => x.saved);
    }

    public async getUnsavedLocalTrips(): Promise<ITrip[]> {
        return (await this.getLocalTrips()).filter(x => !x.saved);
    }

    public async getRemoteTrips(): Promise<ITrip[]> {
        return await spreadsheetDB.trips.toArray();
    }

    public async getRemoteTripsBetweenDates(startDate: string, endDate: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").between(startDate, endDate, true, true).toArray();

        return trips;
    }

    public async getLocalTripsPreviousDays(days: number): Promise<ITrip[]> {
        let date = DateHelper.getISOFormat(DateHelper.getDateFromDays(days));
        let trips = await localDB.trips.where("date").aboveOrEqual(date).toArray();

        return trips;
    }

    public async getRemoteTripsPreviousDays(days: number): Promise<ITrip[]> {
        let date = DateHelper.getISOFormat(DateHelper.getDateFromDays(days));
        let trips = await spreadsheetDB.trips.where("date").aboveOrEqual(date).toArray();

        return trips;
    }

    public async getRemoteTripsPreviousDate(date: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").aboveOrEqual(date).toArray();

        return trips;
    }

    public async queryLocalTrips(field: string, value: string | number): Promise<ITrip[]> {
        return await localDB.trips.where(field).equals(value).toArray();
    }

    public async queryRemoteTrips(field: string, value: string | number): Promise<ITrip[]> {
        return await spreadsheetDB.trips.where(field).equals(value).toArray();
    }

    public async queryTrips(field: string, value: string | number): Promise<ITrip[]> {
        let trips = [...(await this.queryLocalTrips(field, value)).filter(x => !x.saved),
                    ...await this.queryRemoteTrips(field, value)];

        return trips;
    }

    public async saveUnsavedTrips() {
        let trips = await this.getUnsavedLocalTrips();
        trips.forEach(async trip => {
            trip.saved = true;
            await this.updateLocalTrip(trip);
        });
    }

    public async loadTrips(trips: ITrip[]) {
        await spreadsheetDB.trips.clear();
        await spreadsheetDB.trips.bulkAdd(trips);
    }

    public async updateLocalTrip(trip: ITrip) {
        await localDB.trips.put(trip);
    }
}