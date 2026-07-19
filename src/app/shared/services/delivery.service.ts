import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import type { IDelivery } from '@interfaces/entities/delivery.interface';
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