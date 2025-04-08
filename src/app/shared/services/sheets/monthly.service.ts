import { spreadsheetDB } from "@data/spreadsheet.db";
import { IMonthly } from "@interfaces/monthly.interface";
import { GenericCrudService } from "@services/generic-crud.service";
import { liveQuery } from "dexie";

export class MonthlyService  extends GenericCrudService<IMonthly> {
    constructor() {
      super(spreadsheetDB.monthly); // Pass the table reference
    }
    
    monthly$ = liveQuery(() => spreadsheetDB.monthly.toArray());

}