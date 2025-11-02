import { IAddress } from '@interfaces/address.interface';
import { IDaily } from '@interfaces/daily.interface';
import { IDelivery } from '@interfaces/delivery.interface';
import { IMonthly } from '@interfaces/monthly.interface';
import { IName } from '@interfaces/name.interface';
import { IPlace } from '@interfaces/place.interface';
import { IRating } from '@interfaces/rating.interface';
import { IRegion } from '@interfaces/region.interface';
import { IService } from '@interfaces/service.interface';
import { ISetup } from '@interfaces/setup.interface';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { IType } from '@interfaces/type.interface';
import { IWeekday } from '@interfaces/weekday.interface';
import { IWeekly } from '@interfaces/weekly.interface';
import { IYearly } from '@interfaces/yearly.interface';
import { IExpense } from '@interfaces/expense.interface';
import Dexie, { Table } from 'dexie';

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
// - deliveries: Removed 'name' index (not queried)
const SCHEMA_V3 = {
    addresses: '++id, address, saved',
    deliveries: '++id, address',
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
    }
}

export const spreadsheetDB = new AppDB();