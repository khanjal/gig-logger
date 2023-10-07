import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IRegion } from '@interfaces/region.interface';

export class RegionService {
    services$ = liveQuery(() => spreadsheetDB.services.toArray());
    
    public async filter(service: string): Promise<IRegion[]> {
        return await spreadsheetDB.regions.where("region").startsWithAnyOfIgnoreCase(service).toArray();
    }

    public async get(): Promise<IRegion[]> {
        return await spreadsheetDB.regions.toArray();
    }

    public async loadRegions(regions: IRegion[]) {
        await spreadsheetDB.regions.clear();
        await spreadsheetDB.regions.bulkAdd(regions);
    }

    public async update(regions: IRegion[]) {
        let items = await this.get();

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
                item.visits += foundItem.visits;
            }
            else {
                item.id = undefined;
            }
        });

        await spreadsheetDB.regions.bulkPut(regions);
    }
}