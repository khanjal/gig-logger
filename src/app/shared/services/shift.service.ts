import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ShiftModel } from '@models/shift.model';
import { IShift } from '@interfaces/shift.interface';
import { localDB } from '@data/local.db';

export class ShiftService {
    shifts$ = liveQuery(() => spreadsheetDB.shifts.toArray());
    localShifts$ = liveQuery(() => localDB.shifts.toArray());

    public async addNewShift(shift: ShiftModel) {
        await localDB.shifts.add(shift);
    }

    public deleteLocal(shiftId: number) {
        localDB.shifts.delete(shiftId);
    }

    public async getAllShifts(): Promise<IShift[]> {
        let shifts = [...await this.getRemoteShifts(), ...await this.queryLocalShifts("saved", "false")];
        return shifts;
    }

    public async getRemoteShifts(): Promise<IShift[]> {
        return await spreadsheetDB.shifts.toArray();
    }
    
    public async loadShifts(shifts: ShiftModel[]) {
        await spreadsheetDB.shifts.clear();
        await spreadsheetDB.shifts.bulkAdd(shifts);
    }

    public async queryLocalShifts(field: string, value: string | number): Promise<IShift[]> {
        return await localDB.shifts.where(field).equals(value).toArray();
    }

    public async queryRemoteShifts(field: string, value: string | number): Promise<IShift[]> {
        return await spreadsheetDB.shifts.where(field).equals(value).toArray();
    }

    public async queryShiftsByKey(date: string, service: string, number: number): Promise<IShift[]> {
        let localShifts = await localDB.shifts.where('[date+service+number]').equals([date, service, number]).toArray();
        let remoteShifts = await spreadsheetDB.shifts.where('[date+service+number]').equals([date, service, number]).toArray();

        let shifts = [...remoteShifts, ...localShifts];
        return shifts;
    }

    public async updateLocalShift(shift: ShiftModel) {
        await localDB.shifts.put(shift);
    }
}