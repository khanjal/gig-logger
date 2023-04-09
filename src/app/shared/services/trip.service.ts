import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { TripModel } from '@models/trip.model';
import { ITrip } from '@interfaces/trip.interface';
import { localDB } from '@data/local.db';

export class TripService {
    trips$ = liveQuery(() => spreadsheetDB.trips.toArray());
    
    public async addTrip(trip: TripModel) {
        await localDB.trips.add(trip);
    }

    public async getRemoteTrips(): Promise<ITrip[]> {
        return await spreadsheetDB.trips.toArray();
    }

    public async queryLocalTrips(field: string, value: string | number): Promise<ITrip[]> {
        return await localDB.trips.where(field).equals(value).toArray();
    }

    public async loadTrips(trips: TripModel[]) {
        await spreadsheetDB.trips.clear();
        await spreadsheetDB.trips.bulkAdd(trips);
    }

    public async updateLocalTrip(trip: TripModel) {
        await localDB.trips.put(trip);
    }
}