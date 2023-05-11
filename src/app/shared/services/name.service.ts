import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IName } from '@interfaces/name.interface';

export class NameService {
    names$ = liveQuery(() => spreadsheetDB.names.toArray());
    
    public async filterRemoteNames(name: string): Promise<IName[]> {
        return await spreadsheetDB.names.where("name").startsWithAnyOfIgnoreCase(name).toArray();
    }

    public async findRemoteName(name: string): Promise<IName | undefined> {
        return await spreadsheetDB.names.where("name").anyOfIgnoreCase(name).first();
    }

    public async getRemoteNames(): Promise<IName[]> {
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
        let remoteNames = await this.getRemoteNames();

        names.forEach(name => {
            let remoteName = remoteNames.find(x => x.name === name.name);

            if (remoteName) {
                name.id = remoteName.id;
                name.addresses.push(...remoteName.addresses);
                name.bonus += remoteName.bonus;
                name.cash += remoteName.cash;
                name.notes.push(...remoteName.notes);
                name.pay += remoteName.pay;
                name.tip += remoteName.tip;
                name.total += remoteName.total;
                name.visits += remoteName.visits;
            }
            else {
                name.id = undefined;
            }
        });

        await spreadsheetDB.names.bulkPut(names);
    }
}