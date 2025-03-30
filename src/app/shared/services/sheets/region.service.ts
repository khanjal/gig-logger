import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IRegion } from '@interfaces/region.interface';
import { ICrudService } from '@interfaces/crud-service.interface';

export class RegionService implements ICrudService<IRegion> {
    services$ = liveQuery(() => spreadsheetDB.services.toArray());
    
    // Basic CRUD operations
    public async add(region: IRegion) {
        await spreadsheetDB.regions.add(region);
    }

    public async delete(id: number) {
        await spreadsheetDB.regions.delete(id);
    }

    public async filter(region: string): Promise<IRegion[]> {
        return await spreadsheetDB.regions.where("region").startsWithAnyOfIgnoreCase(region).toArray();
    }

    public async find(region: string): Promise<IRegion | undefined> {
        return await spreadsheetDB.regions.where("region").anyOfIgnoreCase(region).first();
    }

    public async get(id: number): Promise<IRegion | undefined> {
        return await spreadsheetDB.regions.where("id").equals(id).first();
    }

    public async list(): Promise<IRegion[]> {
        return await spreadsheetDB.regions.toArray();
    }
    
    public async load(regions: IRegion[]) {
        await spreadsheetDB.regions.clear();
        await spreadsheetDB.regions.bulkAdd(regions);
    }

    public async query(field: string, value: string | number): Promise<IRegion[]> {
        return await spreadsheetDB.regions.where(field).equals(value).toArray();
    }

    public async update(regions: IRegion[]) {
        for (const region of regions) {
            await spreadsheetDB.regions.put(region);
        }
    }

    // Other operations
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
                item.visits += foundItem.visits;
            }
            else {
                item.id = undefined;
            }
        });

        await spreadsheetDB.regions.bulkPut(regions);
    }
}