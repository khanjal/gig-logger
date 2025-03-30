import { spreadsheetDB } from "@data/spreadsheet.db";
import { IYearly } from "@interfaces/yearly.interface";
import { GenericCrudService } from "@services/generic-crud.service";
import { liveQuery } from "dexie";

export class YearlyService extends GenericCrudService<IYearly> {
    constructor() {
      super(spreadsheetDB.yearly); // Pass the table reference
    }

    yearly$ = liveQuery(() => spreadsheetDB.yearly.toArray());

}