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

    public async getRemoteShifts(): Promise<IShift[]> {
        return await spreadsheetDB.shifts.toArray();
    }

    public async queryLocalShifts(field: string, value: string | number): Promise<IShift[]> {
        return await localDB.shifts.where(field).equals(value).toArray();
    }

    public async loadShifts(shifts: ShiftModel[]) {
        await spreadsheetDB.shifts.clear();
        await spreadsheetDB.shifts.bulkAdd(shifts);
    }

    public async updateLocalShift(shift: ShiftModel) {
        await localDB.shifts.put(shift);
    }
}