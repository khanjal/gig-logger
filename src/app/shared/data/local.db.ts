import { IShift } from '@interfaces/shift.interface';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { ITrip } from '@interfaces/trip.interface';
import Dexie, { Table } from 'dexie';


export class AppDB extends Dexie {
    spreadsheets!: Table<ISpreadsheet, string>;
    shifts!: Table<IShift, number>;
    trips!: Table<ITrip, number>;

    constructor() {
        super('localDB');
        this.version(1).stores({
            spreadsheets: 'id, default',
            shifts: '++id, date, service, number, key, [date+service+number]',
            trips: '++id, date, service, number, key, [date+service+number]',
        });
    }
}

export const localDB = new AppDB();