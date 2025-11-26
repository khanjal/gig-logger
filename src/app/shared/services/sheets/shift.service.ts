import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IShift } from '@interfaces/shift.interface';
import { DateHelper } from '@helpers/date.helper';
import { Injectable } from '@angular/core';
import { SyncableCrudService } from '@services/syncable-crud.service';

@Injectable({
    providedIn: 'root'
  })
export class ShiftService extends SyncableCrudService<IShift> {
    constructor() {
      super(spreadsheetDB.shifts); // Pass the table reference
    }

    shifts$ = liveQuery(() => spreadsheetDB.shifts.toArray());

    public async getMaxShiftId(): Promise<number> {
        return await spreadsheetDB.shifts.orderBy("rowId").last().then(x => x?.rowId || 1);
    }

    public async getUnsavedShifts(): Promise<IShift[]> {
        return await this.getUnsaved();
    }
    
    public async getPreviousWeekShifts(): Promise<IShift[]> {
        let shifts = [...await this.getShiftsPreviousDays(7)];

        return shifts;
    }

    public async getShiftsPreviousDays(days: number): Promise<IShift[]> {
        let dates = DateHelper.getDatesArray(days);
        let shifts = await spreadsheetDB.shifts.where("date").anyOf(dates).toArray();

        return shifts;
    }

    public async getShiftsByDate(date: string): Promise<IShift[]> {
        let shifts = [...(await spreadsheetDB.shifts.where("date").equals(date).toArray())];

        return shifts;
    }

    public async getShiftsByStartDate(date: string): Promise<IShift[]> {
        let shifts = [...(await spreadsheetDB.shifts.where("date").aboveOrEqual(date).toArray())];

        return shifts;
    }

    public async getRemoteShiftsBetweenDates(startDate: string, endDate: string): Promise<IShift[]> {
        let shifts = await spreadsheetDB.shifts.where("date").between(startDate, endDate, true, true).toArray();

        return shifts;
    }

    public async getShiftsBetweenDates(startDate: string, endDate: string): Promise<IShift[]> {
        let shifts = [...await this.getRemoteShiftsBetweenDates(startDate, endDate)];

        return shifts;
    }

    public async queryShifts(field: string, value: string | number): Promise<IShift[]> {
        return await spreadsheetDB.shifts.where(field).equals(value).toArray();
    }

    public async queryShiftById(id: number): Promise<IShift> {
        let shift = (await spreadsheetDB.shifts.where('id').equals(id).toArray())[0];

        return shift;
    }

    public async queryShiftByKey(key: string): Promise<IShift> {
        let remoteShift = (await spreadsheetDB.shifts.where('key').equals(key).toArray())[0];

        return remoteShift;
    }

    public async saveUnsavedShifts(): Promise<void> {
        await this.saveUnsaved();
    }

    public async getLastShift(): Promise<IShift | undefined> {
        return await spreadsheetDB.shifts.orderBy("date").reverse().first();
    }
}