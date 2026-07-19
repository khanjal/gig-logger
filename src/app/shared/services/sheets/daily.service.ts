import { Injectable } from "@angular/core";
import { from } from "rxjs";
import { spreadsheetDB } from "@data/spreadsheet.db";
import type { IDaily } from "@interfaces/sheets/daily.interface";
import { GenericCrudService } from "@services/generic-crud.service";
import { liveQuery } from "dexie";

@Injectable({
  providedIn: 'root'
})
export class DailyService extends GenericCrudService<IDaily> {
    constructor() {
      super(spreadsheetDB.daily); // Pass the table reference
    }

    public daily$ = from(liveQuery(() => spreadsheetDB.daily.toArray()));

}