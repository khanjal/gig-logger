import type { IShift } from '@interfaces/entities/shift.interface';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { Table } from 'dexie';
import Dexie from 'dexie';


export class AppDB extends Dexie {
    public spreadsheets!: Table<ISpreadsheet, string>;
    public shifts!: Table<IShift, number>;
    public trips!: Table<ITrip, number>;

    constructor() {
        super('localDB');
        this.version(1).stores({
            spreadsheets: 'id, default',
            shifts: '++id, date, service, number, key, [date+service+number]',
            trips: '++id, date, service, number, key, [date+service+number]',
        });

        // Fires when db.delete() can't complete because another connection
        // (typically another open tab of this app) is still holding the
        // database open. The delete stays pending until that connection closes.
        this.on('blocked', () => {
            console.warn('localDB delete is blocked by another open connection - close other tabs of this app to let it complete.');
        });
    }
}

export const localDB = new AppDB();