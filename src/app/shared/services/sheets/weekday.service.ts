import { Injectable } from "@angular/core";
import { from } from "rxjs";
import { spreadsheetDB } from "@data/spreadsheet.db";
import { IWeekday } from "@interfaces/weekday.interface";
import { GenericCrudService } from "@services/generic-crud.service";
import { liveQuery } from "dexie";

@Injectable({
  providedIn: 'root'
})
export class WeekdayService  extends GenericCrudService<IWeekday> {
    constructor() {
      super(spreadsheetDB.weekdays); // Pass the table reference
    }
    
    weekdays$ = from(liveQuery(() => spreadsheetDB.weekdays.toArray()));

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