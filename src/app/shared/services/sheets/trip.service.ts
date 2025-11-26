import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ITrip } from '@interfaces/trip.interface';
import { DateHelper } from '@helpers/date.helper';
import { ActionEnum } from '@enums/action.enum';
import { Injectable } from '@angular/core';
import { SyncableCrudService } from '@services/syncable-crud.service';
import { updateAction } from '@utils/action.utils';

@Injectable({
    providedIn: 'root'
  })
export class TripService extends SyncableCrudService<ITrip> {
    constructor() {
      super(spreadsheetDB.trips); // Pass the table reference
    }

    trips$ = liveQuery(() => spreadsheetDB.trips.toArray());
    
    public async addNext(trip: ITrip) {
        let nextTrip = {} as ITrip;
        updateAction(nextTrip, ActionEnum.Add);
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
        updateAction(cloneTrip, ActionEnum.Add);
        await this.add(cloneTrip);
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

    public async getBetweenDates(startDate: string, endDate: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").between(startDate, endDate, true, true).toArray();

        return trips;
    }

    public async getByDate(date: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").equals(date).toArray();

        return trips;
    }

    public async getPreviousDays(days: number): Promise<ITrip[]> {
        let date = DateHelper.toISO(DateHelper.getDateFromDays(days));
        let trips = await spreadsheetDB.trips.where("date").aboveOrEqual(date).toArray();

        return trips;
    }


}