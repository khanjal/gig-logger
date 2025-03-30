import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { clearTripAction, ITrip, updateTripAction } from '@interfaces/trip.interface';
import { DateHelper } from '@helpers/date.helper';
import { ActionEnum } from '@enums/action.enum'; // Adjust the import path as necessary
import { Injectable } from '@angular/core';
import { ICrudService } from '@interfaces/crud-service.interface';

@Injectable({
    providedIn: 'root'
  })
export class TripService {
    trips$ = liveQuery(() => spreadsheetDB.trips.toArray());
    
    public async add(trip: ITrip) {
        await spreadsheetDB.trips.add(trip);
    }
    
    public async addNext(trip: ITrip) {
        let nextTrip = {} as ITrip;
        updateTripAction(nextTrip, ActionEnum.Add);
        nextTrip.rowId = await this.getMaxId() + 1;
        nextTrip.key = trip.key;
        nextTrip.date = trip.date;
        nextTrip.region = trip.region;
        nextTrip.service = trip.service;
        nextTrip.number = trip.number;
        nextTrip.place = trip.place;
        nextTrip.type = trip.type;
        nextTrip.startAddress = trip.startAddress;
        nextTrip.pickupTime = trip.dropoffTime;
        await this.add(nextTrip);
    }

    async clone(trip: ITrip) {
        let cloneTrip = trip;
        delete cloneTrip.id;
        cloneTrip.rowId = await this.getMaxId() + 1;
        updateTripAction(cloneTrip, ActionEnum.Add);
        await this.add(cloneTrip);
    }

    public async delete(tripId: number) {
        await spreadsheetDB.trips.delete(tripId);
    }

    public async getMaxId(): Promise<number> {
        return await spreadsheetDB.trips.orderBy("rowId").last().then(x => x?.rowId || 1);
    }

    public async getAll(): Promise<ITrip[]> {
        return await spreadsheetDB.trips.toArray();
    }

    public async queryById(id: number): Promise<ITrip> {
        return (await spreadsheetDB.trips.where('id').equals(id).toArray())[0];
    }

    public async getSaved(): Promise<ITrip[]> {
        return (await this.getAll()).filter(x => x.saved);
    }

    public async getUnsaved(): Promise<ITrip[]> {
        return (await this.getAll()).filter(x => !x.saved);
    }

    public async getBetweenDates(startDate: string, endDate: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").between(startDate, endDate, true, true).toArray();

        return trips;
    }

    public async getByDate(date: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").equals(date).toArray();

        return trips;
    }

    public async getPreviousDays(days: number): Promise<ITrip[]> {
        let date = DateHelper.getISOFormat(DateHelper.getDateFromDays(days));
        let trips = await spreadsheetDB.trips.where("date").aboveOrEqual(date).toArray();

        return trips;
    }

    public async query(field: string, value: string | number): Promise<ITrip[]> {
        return await spreadsheetDB.trips.where(field).equals(value).toArray();
    }

    public async saveUnsaved(trips?: ITrip[]) {
        if (!trips || trips.length === 0) {
            trips = await this.getUnsaved();
        }

        let rowId;
        for (let trip of trips) {
            if (trip.action === ActionEnum.Delete) {
                if (!rowId) {
                    rowId = trip.rowId;
                }
                await this.delete(trip.id!);
                continue;
            }

            let originalTrip = await this.queryById(trip.id!);
            if (originalTrip.actionTime === trip.actionTime) {
                clearTripAction(trip);
                await this.update([trip]);
            }
        };

        if (rowId) {
            await this.updateRowIds(rowId);
        }
    }

    public async load(trips: ITrip[]) {
        await spreadsheetDB.trips.clear();
        await spreadsheetDB.trips.bulkAdd(trips);
    }

    public async update(trips: ITrip[]) {
        for (const trip of trips) {
            await spreadsheetDB.trips.put(trip);
        }
    }

    public async updateRowIds(rowId: number) {
        let maxId = await this.getMaxId();
        let nextRowId = rowId + 1;
        
        // Need to loop id until it finds a trip. Update that trip with a current row id. Then continue until it hits maxId
        while (nextRowId <= maxId) {
            let trip = await spreadsheetDB.trips.where("rowId").equals(nextRowId).first();
            if (trip) {
                trip.rowId = rowId;
                await this.update([trip]);
                rowId++;
            }
            nextRowId++;
        }
    }
}