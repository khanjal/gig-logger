import { from } from 'rxjs';
import { Injectable } from "@angular/core";
import { spreadsheetDB } from "@data/spreadsheet.db";
import { IDaily } from "@interfaces/daily.interface";
import { GenericCrudService } from "@services/generic-crud.service";
import { liveQuery } from "dexie";

@Injectable({
  providedIn: 'root'
})
export class DailyService extends GenericCrudService<IDaily> {
    constructor() {
      super(spreadsheetDB.daily); // Pass the table reference
    }

    daily$ = from(liveQuery(() => spreadsheetDB.daily.toArray()));

}