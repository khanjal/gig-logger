import { Injectable } from "@angular/core";
import { from } from "rxjs";
import { spreadsheetDB } from "@data/spreadsheet.db";
import type { IYearly } from "@interfaces/sheets/yearly.interface";
import { GenericCrudService } from "@services/generic-crud.service";
import { liveQuery } from "dexie";

@Injectable({
  providedIn: 'root'
})
export class YearlyService extends GenericCrudService<IYearly> {
    constructor() {
      super(spreadsheetDB.yearly); // Pass the table reference
    }

    public yearly$ = from(liveQuery(() => spreadsheetDB.yearly.toArray()));

}