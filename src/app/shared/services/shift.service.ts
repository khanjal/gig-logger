import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { clearShiftAction, IShift, updateShiftAction } from '@interfaces/shift.interface';
import { DateHelper } from '@helpers/date.helper';
import { ActionEnum } from '@enums/action.enum';

export class ShiftService {
    shifts$ = liveQuery(() => spreadsheetDB.shifts.toArray());

    public async addNewShift(shift: IShift) {
        await spreadsheetDB.shifts.add(shift);
    }

    public async deleteShift(shiftId: number) {
        spreadsheetDB.shifts.delete(shiftId);
    }

    public async getMaxShiftId(): Promise<number> {
        return await spreadsheetDB.shifts.orderBy("rowId").last().then(x => x?.rowId || 1);
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

    public async queryShiftById(id: number): Promise<IShift> {
        let shift = (await spreadsheetDB.shifts.where('id').equals(id).toArray())[0];

        return shift;
    }

    public async queryShiftByKey(key: string): Promise<IShift> {
        let remoteShift = (await spreadsheetDB.shifts.where('key').equals(key).toArray())[0];

        return remoteShift;
    }

    public async saveUnsavedShifts(shifts?: IShift[]) {
        if (!shifts || shifts.length === 0) {
            shifts = await this.getUnsavedShifts();
        }
        
        let rowId;
        for (let shift of shifts) {
            if (shift.action === ActionEnum.Delete) {
                if (!rowId) {
                    rowId = shift.rowId;
                }
                await this.deleteShift(shift.rowId);
                continue;
            }

            let originalShift = await this.queryShiftById(shift.id!);
            if (originalShift.actionTime === shift.actionTime) {
                clearShiftAction(shift);
                await this.updateShift(shift);
            }
        };
    }

    public async updateShift(shift: IShift) {
        await spreadsheetDB.shifts.put(shift);
    }

    public async updateShiftRowIds(rowId: number) {
        let maxId = await this.getMaxShiftId();
        let nextRowId = rowId + 1;
        
        // Need to loop id until it finds a trip. Update that trip with a current row id. Then continue until it hits maxId
        while (nextRowId <= maxId) {
            let shift = await spreadsheetDB.shifts.where("rowId").equals(nextRowId).first();
            if (shift) {
                shift.rowId = rowId;
                await this.updateShift(shift);
                rowId++;
            }
            nextRowId++;
        }
    }
}