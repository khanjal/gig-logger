import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IRegion } from '@interfaces/region.interface';
import { GenericCrudService } from '@services/generic-crud.service';

export class RegionService extends GenericCrudService<IRegion> {
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
        let items = await this.list();

        regions.forEach(async item => {
            let foundItem = items.find(x => x.region === item.region);

            if (foundItem) {
                console.log(foundItem);
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

        await spreadsheetDB.regions.bulkPut(regions);
    }
}