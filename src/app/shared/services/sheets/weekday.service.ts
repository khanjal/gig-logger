import { spreadsheetDB } from "@data/spreadsheet.db";
import { IWeekday } from "@interfaces/weekday.interface";
import { GenericCrudService } from "@services/generic-crud.service";
import { liveQuery } from "dexie";

export class WeekdayService  extends GenericCrudService<IWeekday> {
    constructor() {
      super(spreadsheetDB.weekdays); // Pass the table reference
    }
    
    weekdays$ = liveQuery(() => spreadsheetDB.weekdays.toArray());

    public async getCurrentTotal() {
        var total = 0;

        await spreadsheetDB.weekdays
            .each (x => total += x.currentAmount);

        return total;
    }

    public async getDailyTotal() {
        var total = 0;

        await spreadsheetDB.weekdays
            .each (x => total += x.dailyAverage);

        return total;
    }

    public async getPreviousTotal() {
        var total = 0;

        await spreadsheetDB.weekdays
            .each (x => total += x.dailyPrevAverage);

        return total;
    }
}