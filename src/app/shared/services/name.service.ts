import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IName } from '@interfaces/name.interface';

export class NameService {
    names$ = liveQuery(() => spreadsheetDB.names.toArray());
    
    public async filterNames(name: string): Promise<IName[]> {
        return await spreadsheetDB.names.where("name").startsWithAnyOfIgnoreCase(name).toArray();
    }

    public async findName(name: string): Promise<IName | undefined> {
        return await spreadsheetDB.names.where("name").anyOfIgnoreCase(name).first();
    }

    public async getNames(): Promise<IName[]> {
        return await spreadsheetDB.names.toArray();
    }

    public async loadNames(names: IName[]) {
        await spreadsheetDB.names.clear();
        await spreadsheetDB.names.bulkAdd(names);
    }

    public async update(name: IName) {
        await spreadsheetDB.names.put(name);
    }

    public async updateNames(names: IName[]) {
        let existingNames = await this.getNames();

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