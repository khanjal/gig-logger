import { spreadsheetDB } from "@data/spreadsheet.db";
import { IWeekly } from "@interfaces/weekly.interface";
import { GenericCrudService } from "@services/generic-crud.service";
import { liveQuery } from "dexie";

export class WeeklyService  extends GenericCrudService<IWeekly> {
    constructor() {
      super(spreadsheetDB.weekly); // Pass the table reference
    }

    weekly$ = liveQuery(() => spreadsheetDB.weekly.toArray());

    public async getLastWeekFromDay(day: string) {
        return (await spreadsheetDB.weekly.where("begin").below(day).last());
    }
}