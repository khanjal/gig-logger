import { spreadsheetDB } from "@data/spreadsheet.db";
import { IYearly } from "@interfaces/yearly.interface";
import { liveQuery } from "dexie";

export class YearlyService {
    yearly$ = liveQuery(() => spreadsheetDB.yearly.toArray());

    public async loadyearly(yearly: IYearly[]) {
        await spreadsheetDB.yearly.clear();
        await spreadsheetDB.yearly.bulkAdd(yearly);
    }

    public async queryyearly(field: string, value: string | number): Promise<IYearly[]> {
        return await spreadsheetDB.yearly.where(field).equals(value).toArray();
    }

    public async updateyearly(yearly: IYearly) {
        await spreadsheetDB.yearly.put(yearly);
    }
}