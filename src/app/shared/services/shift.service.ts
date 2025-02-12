import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IShift } from '@interfaces/shift.interface';
import { DateHelper } from '@helpers/date.helper';

export class ShiftService {
    shifts$ = liveQuery(() => spreadsheetDB.shifts.toArray());

    public async addNewShift(shift: IShift) {
        await spreadsheetDB.shifts.add(shift);
    }

    public deleteShift(shiftId: number) {
        spreadsheetDB.shifts.delete(shiftId);
    }

    public async getMaxShiftId(): Promise<number> {
        return await spreadsheetDB.shifts.orderBy("rowId").last().then(x => x?.rowId || 2);
    }

    public async getShifts(): Promise<IShift[]> {
        return await spreadsheetDB.shifts.toArray();
    }

    public async getUnsavedShifts(): Promise<IShift[]> {
        return (await spreadsheetDB.shifts.toArray()).filter(x => !x.saved);
    }
    
    public async loadShifts(shifts: IShift[]) {
        await spreadsheetDB.shifts.clear();
        await spreadsheetDB.shifts.bulkAdd(shifts);
    }

    public async getPreviousWeekShifts(): Promise<IShift[]> {
        let shifts = [...await this.getShiftsPreviousDays(6)];

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

    public async queryShiftByKey(key: string): Promise<IShift> {
        let remoteShift = (await spreadsheetDB.shifts.where('key').equals(key).toArray())[0];

        return remoteShift;
    }

    public async saveUnsavedShifts() {
        let shifts = await this.getUnsavedShifts();
        for (let shift of shifts) {
            shift.saved = true;
            await this.updateShift(shift);
        };
    }

    public async updateShift(shift: IShift) {
        await spreadsheetDB.shifts.put(shift);
    }
}