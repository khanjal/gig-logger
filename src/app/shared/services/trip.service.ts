import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { TripModel } from '@models/trip.model';
import { ITrip } from '@interfaces/trip.interface';

export class TripService {
    trips$ = liveQuery(() => spreadsheetDB.trips.toArray());
    
    public async getRemoteTrips(): Promise<ITrip[]> {
        return await spreadsheetDB.trips.toArray();
    }


    public async loadTrips(trips: TripModel[]) {
        await spreadsheetDB.trips.clear();
        await spreadsheetDB.trips.bulkAdd(trips);
    }
}