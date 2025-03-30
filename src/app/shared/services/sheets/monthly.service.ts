import { spreadsheetDB } from "@data/spreadsheet.db";
import { IMonthly } from "@interfaces/monthly.interface";
import { liveQuery } from "dexie";

export class MonthlyService {
    monthly$ = liveQuery(() => spreadsheetDB.monthly.toArray());

    public async loadMonthly(monthly: IMonthly[]) {
        await spreadsheetDB.monthly.clear();
        await spreadsheetDB.monthly.bulkAdd(monthly);
    }

    public async queryMonthly(field: string, value: string | number): Promise<IMonthly[]> {
        return await spreadsheetDB.monthly.where(field).equals(value).toArray();
    }

    public async updateMonthly(monthly: IMonthly) {
        await spreadsheetDB.monthly.put(monthly);
    }
}