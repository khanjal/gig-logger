import type { IAddress } from '@interfaces/entities/address.interface';
import type { IDaily } from '@interfaces/sheets/daily.interface';
import type { IDelivery } from '@interfaces/entities/delivery.interface';
import type { IMonthly } from '@interfaces/sheets/monthly.interface';
import type { IName } from '@interfaces/entities/name.interface';
import type { IPlace } from '@interfaces/entities/place.interface';
import type { IRating } from '@interfaces/entities/rating.interface';
import type { IRegion } from '@interfaces/entities/region.interface';
import type { IService } from '@interfaces/entities/service.interface';
import type { ISetup } from '@interfaces/sheets/setup.interface';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IType } from '@interfaces/entities/type.interface';
import type { IWeekday } from '@interfaces/sheets/weekday.interface';
import type { IWeekly } from '@interfaces/sheets/weekly.interface';
import type { IYearly } from '@interfaces/sheets/yearly.interface';
import type { IExpense } from '@interfaces/entities/expense.interface';
import type { Table } from 'dexie';
import Dexie from 'dexie';

// https://dexie.org/docs/Tutorial/Angular

// Database schema versions - modularized for maintainability
const SCHEMA_V1 = {
    addresses: '++id, address',
    deliveries: '++id, address, name',
    daily: '++id, date',
    monthly: '++id, month',
    names: '++id, name',
    places: '++id, place',
    ratings: '++id, date, time',
    regions: '++id, region',
    services: '++id, service',
    setup: '++id, name',
    shifts: '++id, date, service, number, key, [date+service+number]',
    trips: '++id, date, service, number, key, [date+service+number]',
    types: '++id, type',
    weekdays: '++id, day',
    weekly: '++id, week, begin, end',
    yearly: '++id, year'
};

// Version 2: Added 'saved' field to track sync status and 'rowId' for shifts/trips
// Also added expenses table (basic schema without full sync support)
const SCHEMA_V2 = {
    addresses: '++id, address, saved',
    deliveries: '++id, address, name',
    daily: '++id, date',
    expenses: '++id, date, amount, category, note',
    monthly: '++id, month',
    names: '++id, name, saved',
    places: '++id, place, saved',
    ratings: '++id, date, time',
    regions: '++id, region, saved',
    services: '++id, service, saved',
    setup: '++id, name, saved',
    shifts: '++id, rowId, date, service, number, key, [date+service+number], saved',
    trips: '++id, rowId, date, service, number, key, [date+service+number], saved',
    types: '++id, type, saved',
    weekdays: '++id, day',
    weekly: '++id, week, begin, end',
    yearly: '++id, year'
};

// Version 3: Optimized indexes based on actual query patterns
// Changes:
// - expenses: Added rowId, date, saved (queries use where('saved'), date for grouping/sorting)
const SCHEMA_V3 = {
    addresses: '++id, address, saved',
    deliveries: '++id, address, name',
    daily: '++id, date',
    expenses: '++id, rowId, date, saved',
    monthly: '++id, month',
    names: '++id, name, saved',
    places: '++id, place, saved',
    ratings: '++id, date, time',
    regions: '++id, region, saved',
    services: '++id, service, saved',
    setup: '++id, name, saved',
    shifts: '++id, rowId, date, service, number, key, [date+service+number], saved',
    trips: '++id, rowId, date, service, number, key, [date+service+number], saved',
    types: '++id, type, saved',
    weekdays: '++id, day',
    weekly: '++id, week, begin, end',
    yearly: '++id, year'
};

export class AppDB extends Dexie {
    addresses!: Table<IAddress, number>;
    daily!: Table<IDaily, number>;
    deliveries!: Table<IDelivery, number>;
    expenses!: Table<IExpense, number>;
    monthly!: Table<IMonthly, number>;
    names!: Table<IName, number>;
    places!: Table<IPlace, number>;
    ratings!: Table<IRating, number>;
    regions!: Table<IRegion, number>;
    services!: Table<IService, number>;
    setup!: Table<ISetup, number>;
    shifts!: Table<IShift, number>;
    trips!: Table<ITrip, number>;
    types!: Table<IType, number>;
    weekdays!: Table<IWeekday, number>;
    weekly!: Table<IWeekly, number>;
    yearly!: Table<IYearly, number>;

    constructor() {
        super('spreadsheetDB');
        this.version(1).stores(SCHEMA_V1);
        this.version(2).stores(SCHEMA_V2);
        this.version(3).stores(SCHEMA_V3);

        // Fires when db.delete() can't complete because another connection
        // (typically another open tab of this app) is still holding the
        // database open. The delete stays pending until that connection closes.
        this.on('blocked', () => {
            console.warn('spreadsheetDB delete is blocked by another open connection - close other tabs of this app to let it complete.');
        });
    }
}

export const spreadsheetDB = new AppDB();