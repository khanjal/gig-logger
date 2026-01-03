import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IType } from '@interfaces/type.interface';
import { GenericCrudService } from '@services/generic-crud.service';
import { LoggerService } from '../logger.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TypeService extends GenericCrudService<IType> {
    private _logger = new LoggerService();
    
    constructor() {
      super(spreadsheetDB.types); // Pass the table reference
    }
    
    services$ = liveQuery(() => spreadsheetDB.services.toArray());
   
    public async deleteUnsaved() {
        let types = await this.getUnsaved();
        types.forEach(async type => {
            await spreadsheetDB.types.delete(type.id!);
        });
    }

    public async getUnsaved(): Promise<IType[]> {
        return (await this.list()).filter(x => !x.saved);
    }

    public async append(types: IType[]) {
        const items = await this.list();

        for (let i = 0; i < types.length; i++) {
            const item = types[i];
            const foundItem = items.find(x => x.type === item.type);

            if (foundItem) {
                this._logger.debug('Found existing type item', foundItem);
                // Accumulate new values into existing
                foundItem.bonus += item.bonus;
                foundItem.cash += item.cash;
                foundItem.pay += item.pay;
                foundItem.tip += item.tip;
                foundItem.total += item.total;
                foundItem.trips += item.trips;

                // Replace with merged type
                types[i] = foundItem;
            }
            else {
                item.id = undefined;
            }
        }

        await spreadsheetDB.types.bulkPut(types);
    }
}