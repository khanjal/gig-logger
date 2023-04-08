import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import Dexie, { Table } from 'dexie';


export class AppDB extends Dexie {
    shifts!: Table<IShift, number>;
    trips!: Table<ITrip, number>;

    constructor() {
        super('localQuery');
        this.version(1).stores({
        shifts: '++id',
        trips: '++id',
        });
    }
}

export const localDB = new AppDB();