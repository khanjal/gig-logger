import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { spreadsheetDB } from '@data/spreadsheet.db';
import type { IShift } from '@interfaces/entities/shift.interface';
import { DateHelper } from '@helpers/date.helper';
import { Injectable } from '@angular/core';
import { SyncableCrudService } from '@services/syncable-crud.service';
import { SheetSerializerHelper } from '@helpers/sheet-serializer.helper';

@Injectable({
    providedIn: 'root'
  })
export class ShiftService extends SyncableCrudService<IShift> {
    constructor() {
      super(spreadsheetDB.shifts); // Pass the table reference
    }

    public shifts$ = from(liveQuery(() => spreadsheetDB.shifts.toArray()));

    /**
     * The sheet stores tags as comma-delimited text; the app works with an array. Translate on the
     * way in, so nothing downstream has to know the wire format.
     */
    public override async load(items: IShift[]): Promise<void> {
        await super.load(SheetSerializerHelper.deserializeShifts(items));
    }


    public async getUnsavedShifts(): Promise<IShift[]> {
        return await this.getUnsaved();
    }
    
    public async getPreviousWeekShifts(): Promise<IShift[]> {
        const shifts = [...await this.getShiftsPreviousDays(7)];

        return shifts;
    }

    public async getShiftsPreviousDays(days: number): Promise<IShift[]> {
        const dates = DateHelper.getDatesArray(days);
        const shifts = await spreadsheetDB.shifts.where("date").anyOf(dates).toArray();

        return shifts;
    }

    public async getShiftsByDate(date: string): Promise<IShift[]> {
        const shifts = [...(await spreadsheetDB.shifts.where("date").equals(date).toArray())];

        return shifts;
    }

    public async getShiftsByStartDate(date: string): Promise<IShift[]> {
        const shifts = [...(await spreadsheetDB.shifts.where("date").aboveOrEqual(date).toArray())];

        return shifts;
    }

    public async getRemoteShiftsBetweenDates(startDate: string, endDate: string): Promise<IShift[]> {
        const shifts = await spreadsheetDB.shifts.where("date").between(startDate, endDate, true, true).toArray();

        return shifts;
    }

    public async getShiftsBetweenDates(startDate: string, endDate: string): Promise<IShift[]> {
        const shifts = [...await this.getRemoteShiftsBetweenDates(startDate, endDate)];

        return shifts;
    }



    public async queryShiftByKey(key: string): Promise<IShift> {
        const remoteShift = (await spreadsheetDB.shifts.where('key').equals(key).toArray())[0];

        return remoteShift;
    }

    public async saveUnsavedShifts(saveStartedAt?: number, syncedIds?: ReadonlySet<number>): Promise<void> {
        await this.saveUnsaved(saveStartedAt, syncedIds);
    }

    public async getLastShift(): Promise<IShift | undefined> {
        return await spreadsheetDB.shifts.orderBy("date").reverse().first();
    }
}