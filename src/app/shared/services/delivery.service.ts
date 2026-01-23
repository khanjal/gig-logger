import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IDelivery } from '@interfaces/delivery.interface';
import { Injectable } from '@angular/core';
import { GenericCrudService } from '@services/generic-crud.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService extends GenericCrudService<IDelivery> {
    constructor() {
      super(spreadsheetDB.deliveries); // Pass the table reference
    }

    deliveries$ = liveQuery(() => spreadsheetDB.deliveries.toArray());
}