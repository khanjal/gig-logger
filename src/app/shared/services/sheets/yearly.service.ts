import { Injectable } from "@angular/core";
import { from } from "rxjs";
import { spreadsheetDB } from "@data/spreadsheet.db";
import { IYearly } from "@interfaces/yearly.interface";
import { GenericCrudService } from "@services/generic-crud.service";
import { liveQuery } from "dexie";

@Injectable({
  providedIn: 'root'
})
export class YearlyService extends GenericCrudService<IYearly> {
    constructor() {
      super(spreadsheetDB.yearly); // Pass the table reference
    }

    yearly$ = from(liveQuery(() => spreadsheetDB.yearly.toArray()));

}