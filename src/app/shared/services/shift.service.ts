import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IShift } from '@interfaces/shift.interface';
import { localDB } from '@data/local.db';
import { DateHelper } from '@helpers/date.helper';

export class ShiftService {
    shifts$ = liveQuery(() => spreadsheetDB.shifts.toArray());
    localShifts$ = liveQuery(() => localDB.shifts.toArray());

    public async addNewShift(shift: IShift) {
        await localDB.shifts.add(shift);
    }

    public deleteLocal(shiftId: number) {
        localDB.shifts.delete(shiftId);
    }

    public async getAllShifts(): Promise<IShift[]> {
        let shifts = [...await this.getRemoteShifts(), ...await this.getUnsavedLocalShifts()];
        return shifts;
    }

    public async getRemoteShifts(): Promise<IShift[]> {
        return await spreadsheetDB.shifts.toArray();
    }

    public async getSavedLocalShifts(): Promise<IShift[]> {
        return (await localDB.shifts.toArray()).filter(x => x.saved);
    }

    public async getUnsavedLocalShifts(): Promise<IShift[]> {
        return (await localDB.shifts.toArray()).filter(x => !x.saved);
    }
    
    public async loadShifts(shifts: IShift[]) {
        await spreadsheetDB.shifts.clear();
        await spreadsheetDB.shifts.bulkAdd(shifts);
    }

    public async getPreviousWeekShifts(): Promise<IShift[]> {
        let shifts = [...await this.getRemoteShiftsPreviousDays(7), 
            ...(await this.getLocalShiftsPreviousDays(7)).filter(x => !x.saved)];

        return shifts;
    }

    public async getLocalShiftsPreviousDays(days: number): Promise<IShift[]> {
        let dates = DateHelper.getDatesArray(days);
        let shifts = await localDB.shifts.where("date").anyOf(dates).toArray();

        return shifts;
    }

    public async getRemoteShiftsPreviousDays(days: number): Promise<IShift[]> {
        let dates = DateHelper.getDatesArray(days);
        let shifts = await spreadsheetDB.shifts.where("date").anyOf(dates).toArray();

        return shifts;
    }

    public async getRemoteShiftsPreviousDate(date: string): Promise<IShift[]> {
        let shifts = await spreadsheetDB.shifts.where("date").aboveOrEqual(date).toArray();

        return shifts;
    }

    public async getRemoteShiftsBetweenDates(startDate: string, endDate: string): Promise<IShift[]> {
        let shifts = await spreadsheetDB.shifts.where("date").between(startDate, endDate, true, true).toArray();

        return shifts;
    }

    public async queryLocalShifts(field: string, value: string | number): Promise<IShift[]> {
        return await localDB.shifts.where(field).equals(value).toArray();
    }

    public async queryRemoteShifts(field: string, value: string | number): Promise<IShift[]> {
        return await spreadsheetDB.shifts.where(field).equals(value).toArray();
    }

    public async queryShiftByKey(key: string): Promise<IShift> {
        let remoteShift = (await spreadsheetDB.shifts.where('key').equals(key).toArray())[0];

        if (remoteShift) {
            return remoteShift;
        }

        let localShift = (await localDB.shifts.where('key').equals(key).toArray())[0];
        return localShift;
    }

    public async saveUnsavedShifts() {
        let shifts = await this.getUnsavedLocalShifts();
        shifts.forEach(async shift => {
            shift.saved = true;
            await this.updateLocalShift(shift);
        });
    }

    public async updateShift(shift: IShift) {
        (shift.saved ? await this.updateRemoteShift(shift) : await this.updateLocalShift(shift));
    }

    public async updateLocalShift(shift: IShift) {
        await localDB.shifts.put(shift);
    }

    public async updateRemoteShift(shift: IShift) {
        await spreadsheetDB.shifts.put(shift);
    }
}