import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { clearTripAction, ITrip, updateTripAction } from '@interfaces/trip.interface';
import { DateHelper } from '@helpers/date.helper';
import { ActionEnum } from '@enums/action.enum'; // Adjust the import path as necessary
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
  })
export class TripService {
    trips$ = liveQuery(() => spreadsheetDB.trips.toArray());
    
    public async addTrip(trip: ITrip) {
        await spreadsheetDB.trips.add(trip);
    }
    
    public async addNextTrip(trip: ITrip) {
        let nextTrip = {} as ITrip;
        updateTripAction(nextTrip, ActionEnum.Add);
        nextTrip.rowId = await this.getMaxTripId() + 1;
        nextTrip.key = trip.key;
        nextTrip.date = trip.date;
        nextTrip.region = trip.region;
        nextTrip.service = trip.service;
        nextTrip.number = trip.number;
        nextTrip.place = trip.place;
        nextTrip.type = trip.type;
        nextTrip.startAddress = trip.startAddress;
        nextTrip.pickupTime = trip.dropoffTime;
        await this.addTrip(nextTrip);
    }

    async cloneTrip(trip: ITrip) {
        let cloneTrip = trip;
        delete cloneTrip.id;
        cloneTrip.rowId = await this.getMaxTripId() + 1;
        updateTripAction(cloneTrip, ActionEnum.Add);
        await this.addTrip(cloneTrip);
    }

    public async deleteTrip(tripId: number) {
        await spreadsheetDB.trips.delete(tripId);
    }

    public async getMaxTripId(): Promise<number> {
        return await spreadsheetDB.trips.orderBy("rowId").last().then(x => x?.rowId || 1);
    }

    public async getTrips(): Promise<ITrip[]> {
        return await spreadsheetDB.trips.toArray();
    }

    public async queryTripById(id: number): Promise<ITrip> {
        return (await spreadsheetDB.trips.where('id').equals(id).toArray())[0];
    }

    public async getSavedTrips(): Promise<ITrip[]> {
        return (await this.getTrips()).filter(x => x.saved);
    }

    public async getUnsavedTrips(): Promise<ITrip[]> {
        return (await this.getTrips()).filter(x => !x.saved);
    }

    public async getTripsBetweenDates(startDate: string, endDate: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").between(startDate, endDate, true, true).toArray();

        return trips;
    }

    public async getTripsByDate(date: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").equals(date).toArray();

        return trips;
    }

    public async getTripsPreviousDays(days: number): Promise<ITrip[]> {
        let date = DateHelper.getISOFormat(DateHelper.getDateFromDays(days));
        let trips = await spreadsheetDB.trips.where("date").aboveOrEqual(date).toArray();

        return trips;
    }

    public async queryTrips(field: string, value: string | number): Promise<ITrip[]> {
        return await spreadsheetDB.trips.where(field).equals(value).toArray();
    }

    public async saveUnsavedTrips(trips?: ITrip[]) {
        if (!trips || trips.length === 0) {
            trips = await this.getUnsavedTrips();
        }

        let rowId;
        for (let trip of trips) {
            if (trip.action === ActionEnum.Delete) {
                if (!rowId) {
                    rowId = trip.rowId;
                }
                await this.deleteTrip(trip.id!);
                continue;
            }

            let originalTrip = await this.queryTripById(trip.id!);
            if (originalTrip.actionTime === trip.actionTime) {
                clearTripAction(trip);
                await this.updateTrip(trip);
            }
        };

        if (rowId) {
            await this.updateTripRowIds(rowId);
        }
    }

    public async loadTrips(trips: ITrip[]) {
        await spreadsheetDB.trips.clear();
        await spreadsheetDB.trips.bulkAdd(trips);
    }

    public async updateTrip(trip: ITrip) {
        await spreadsheetDB.trips.put(trip);
    }

    public async updateTripRowIds(rowId: number) {
        let maxId = await this.getMaxTripId();
        let nextRowId = rowId + 1;
        
        // Need to loop id until it finds a trip. Update that trip with a current row id. Then continue until it hits maxId
        while (nextRowId <= maxId) {
            let trip = await spreadsheetDB.trips.where("rowId").equals(nextRowId).first();
            if (trip) {
                trip.rowId = rowId;
                await this.updateTrip(trip);
                rowId++;
            }
            nextRowId++;
        }
    }
}