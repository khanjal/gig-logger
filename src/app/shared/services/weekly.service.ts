import { spreadsheetDB } from "@data/spreadsheet.db";
import { IWeekly } from "@interfaces/weekly.interface";
import { liveQuery } from "dexie";

export class WeeklyService {
    weekly$ = liveQuery(() => spreadsheetDB.weekly.toArray());

    public async loadweekly(weekly: IWeekly[]) {
        await spreadsheetDB.weekly.clear();
        await spreadsheetDB.weekly.bulkAdd(weekly);
    }

    public async queryweekly(field: string, value: string | number): Promise<IWeekly[]> {
        return await spreadsheetDB.weekly.where(field).equals(value).toArray();
    }

    public async updateweekly(weekly: IWeekly) {
        await spreadsheetDB.weekly.put(weekly);
    }
}