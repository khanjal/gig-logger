import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ShiftModel } from '@models/shift.model';
import { IShift } from '@interfaces/shift.interface';

export class ShiftService {
    shifts$ = liveQuery(() => spreadsheetDB.shifts.toArray());

    public async addNewShift(shift: ShiftModel) {
        await spreadsheetDB.shifts.add({
            id: shift.id,
            date: shift.date,
            distance: shift.distance,
            end: shift.end,
            key: shift.key,
            saved: shift.saved,
            service: shift.service,
            number: shift.number,
            start: shift.start,
            total: shift.total,
            trips: shift.trips
        });
    }

    public async getRemoteShifts(): Promise<IShift[]> {
        return await spreadsheetDB.shifts.toArray();
    }


    public async loadShifts(shifts: ShiftModel[]) {
        await spreadsheetDB.shifts.clear();
        await spreadsheetDB.shifts.bulkAdd(shifts);
    }
}