import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IName } from '@interfaces/name.interface';
import { ICrudService } from '@interfaces/crud-service.interface';
import { ICrudAdvanced } from '@interfaces/crud-advanced.interface';

export class NameService implements ICrudAdvanced<IName> {
    names$ = liveQuery(() => spreadsheetDB.names.toArray());
    
    // Basic CRUD operations
    public async add(name: IName) {
        await spreadsheetDB.names.add(name);
    }

    public async delete(id: number) {
        await spreadsheetDB.names.delete(id);
    }

    public async filter(name: string): Promise<IName[]> {
        return await spreadsheetDB.names.where("name").startsWithAnyOfIgnoreCase(name).toArray();
    }

    public async find(name: string): Promise<IName | undefined> {
        return await spreadsheetDB.names.where("name").anyOfIgnoreCase(name).first();
    }

    public async get(id: number): Promise<IName | undefined> {
        return await spreadsheetDB.names.where("id").equals(id).first();
    }

    public async list(): Promise<IName[]> {
        return await spreadsheetDB.names.toArray();
    }
    
    public async load(names: IName[]) {
        await spreadsheetDB.names.clear();
        await spreadsheetDB.names.bulkAdd(names);
    }

    public async query(field: string, value: string | number): Promise<IName[]> {
        return await spreadsheetDB.names.where(field).equals(value).toArray();
    }

    public async update(names: IName[]) {
        for (const name of names) {
            await spreadsheetDB.names.put(name);
        }
    }

    // Other operations
    public async deleteUnsaved() {
        let names = await this.getUnsaved();
        names.forEach(async name => {
            await spreadsheetDB.names.delete(name.id!);
        });
    }

    public async getUnsaved(): Promise<IName[]> {
        return (await this.list()).filter(x => !x.saved);
    }

    public async append(names: IName[]) {
        let existingNames = await this.list();

        names.forEach(name => {
            let remoteName = existingNames.find(x => x.name === name.name);

            if (remoteName) {
                name.id = remoteName.id;
                name.bonus += remoteName.bonus;
                name.cash += remoteName.cash;
                name.pay += remoteName.pay;
                name.tip += remoteName.tip;
                name.total += remoteName.total;
                name.visits += remoteName.visits;

                if (!name.addresses) {
                    name.addresses = [];
                }

                if (remoteName.addresses) {
                    name.addresses.push(...remoteName.addresses);
                }

                if (!name.notes) {
                    name.notes = [];
                }

                if (remoteName.notes) {
                    name.notes.push(...remoteName.notes);
                }
            }
            else {
                name.id = undefined;
            }
        });

        await spreadsheetDB.names.bulkPut(names);
    }
}