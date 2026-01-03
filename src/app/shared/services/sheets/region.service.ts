import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IRegion } from '@interfaces/region.interface';
import { GenericCrudService } from '@services/generic-crud.service';
import { LoggerService } from '../logger.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RegionService extends GenericCrudService<IRegion> {
    private _logger = new LoggerService();
    
    constructor() {
      super(spreadsheetDB.regions); // Pass the table reference
    }

    services$ = liveQuery(() => spreadsheetDB.services.toArray());
    
    public async deleteUnsaved() {
        let regions = await this.getUnsaved();
        regions.forEach(async region => {
            await spreadsheetDB.regions.delete(region.id!);
        });
    }

    public async getUnsaved(): Promise<IRegion[]> {
        return (await this.list()).filter(x => !x.saved);
    }

     public async append(regions: IRegion[]) {
        const items = await this.list();
        
        for (let i = 0; i < regions.length; i++) {
            const item = regions[i];
            const foundItem = items.find(x => x.region === item.region);

            if (foundItem) {
                this._logger.debug('Found existing region item', foundItem);
                // Accumulate new values into existing
                foundItem.bonus += item.bonus;
                foundItem.cash += item.cash;
                foundItem.pay += item.pay;
                foundItem.tip += item.tip;
                foundItem.total += item.total;
                foundItem.trips += item.trips;

                // Replace with merged region
                regions[i] = foundItem;
            }
            else {
                item.id = undefined;
            }
        }

        await spreadsheetDB.regions.bulkPut(regions);
    }
}