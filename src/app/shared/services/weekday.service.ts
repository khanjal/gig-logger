import { spreadsheetDB } from "@data/spreadsheet.db";
import { IWeekday } from "@interfaces/weekday.interface";
import { liveQuery } from "dexie";

export class WeekdayService {
    weekdays$ = liveQuery(() => spreadsheetDB.weekdays.toArray());
    
    public async loadWeekdays(weekdays: IWeekday[]) {
        await spreadsheetDB.weekdays.clear();
        await spreadsheetDB.weekdays.bulkAdd(weekdays);
    }

    public async queryWeekdays(field: string, value: string | number): Promise<IWeekday[]> {
        return await spreadsheetDB.weekdays.where(field).equals(value).toArray();
    }
}