import { IAddress } from '@interfaces/address.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IService } from '@interfaces/service.interface';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { IWeekday } from '@interfaces/weekday.interface';
import Dexie, { Table } from 'dexie';

// https://dexie.org/docs/Tutorial/Angular

export class AppDB extends Dexie {
    addresses!: Table<IAddress, number>;
    names!: Table<IName, number>;
    places!: Table<IPlace, number>;
    services!: Table<IService, number>;
    shifts!: Table<IShift, number>;
    trips!: Table<ITrip, number>;
    weekdays!: Table<IWeekday, number>;

    constructor() {
        super('spreadsheetDB');
        this.version(1).stores({
            addresses: '++id, address',
            names: '++id, name',
            places: '++id, place',
            services: '++id, service',
            shifts: '++id, date, service, number, key, [date+service+number]',
            trips: '++id, date, service, number, key, [date+service+number]',
            weekdays: '++id, day'
        });
    }
}

export const spreadsheetDB = new AppDB();