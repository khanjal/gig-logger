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
        let items = await this.list();

        types.forEach(async item => {
            let foundItem = items.find(x => x.type === item.type);

            if (foundItem) {
                this._logger.debug('Found existing type item', foundItem);
                item.id = foundItem.id;
                item.bonus += foundItem.bonus;
                item.cash += foundItem.cash;
                item.pay += foundItem.pay;
                item.tip += foundItem.tip;
                item.total += foundItem.total;
                item.trips += foundItem.trips;
            }
            else {
                item.id = undefined;
            }
        });

        await spreadsheetDB.types.bulkPut(types);
    }
}