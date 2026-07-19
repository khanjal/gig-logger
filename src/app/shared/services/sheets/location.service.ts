import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import type { ILocation } from '@interfaces/entities/location.interface';
import { Injectable } from '@angular/core';
import { GenericCrudService } from '@services/generic-crud.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService extends GenericCrudService<ILocation> {
    constructor() {
      super(spreadsheetDB.locations); // Pass the table reference
    }

    public locations$ = liveQuery(() => spreadsheetDB.locations.toArray());
}
