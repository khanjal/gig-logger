import { spreadsheetDB } from "@data/spreadsheet.db";
import { IDaily } from "@interfaces/daily.interface";
import { liveQuery } from "dexie";

export class DailyService {
    daily$ = liveQuery(() => spreadsheetDB.daily.toArray());

    public async loadDaily(daily: IDaily[]) {
        await spreadsheetDB.daily.clear();
        await spreadsheetDB.daily.bulkAdd(daily);
    }

    public async queryDaily(field: string, value: string | number): Promise<IDaily[]> {
        return await spreadsheetDB.daily.where(field).equals(value).toArray();
    }

    public async updateDaily(daily: IDaily) {
        await spreadsheetDB.daily.put(daily);
    }
}