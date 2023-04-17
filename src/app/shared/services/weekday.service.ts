import { spreadsheetDB } from "@data/spreadsheet.db";
import { IWeekday } from "@interfaces/weekday.interface";
import { liveQuery } from "dexie";

export class WeekdayService {
    weekdays$ = liveQuery(() => spreadsheetDB.weekdays.toArray());
    
    public async loadWeekdays(weekdays: IWeekday[]) {
        await spreadsheetDB.weekdays.clear();
        await spreadsheetDB.weekdays.bulkAdd(weekdays);
    }
}