import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IType } from '@interfaces/type.interface';
import { ICrudService } from '@interfaces/crud-service.interface';

export class TypeService implements ICrudService<IType> {
    services$ = liveQuery(() => spreadsheetDB.services.toArray());
    
    // Basic CRUD operations
    public async add(type: IType) {
        await spreadsheetDB.types.add(type);
    }

    public async delete(id: number) {
        await spreadsheetDB.types.delete(id);
    }

    public async filter(type: string): Promise<IType[]> {
        return await spreadsheetDB.types.where("type").startsWithAnyOfIgnoreCase(type).toArray();
    }

    public async find(type: string): Promise<IType | undefined> {
        return await spreadsheetDB.types.where("type").anyOfIgnoreCase(type).first();
    }

    public async get(id: number): Promise<IType | undefined> {
        return await spreadsheetDB.types.where("id").equals(id).first();
    }

    public async list(): Promise<IType[]> {
        return await spreadsheetDB.types.toArray();
    }
    
    public async load(types: IType[]) {
        await spreadsheetDB.types.clear();
        await spreadsheetDB.types.bulkAdd(types);
    }

    public async query(field: string, value: string | number): Promise<IType[]> {
        return await spreadsheetDB.types.where(field).equals(value).toArray();
    }

    public async update(types: IType[]) {
        for (const type of types) {
            await spreadsheetDB.types.put(type);
        }
    }
    
    // Other operations
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

        await spreadsheetDB.types.bulkPut(types);
    }
}