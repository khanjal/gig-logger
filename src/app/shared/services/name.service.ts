import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { NameModel } from '@models/name.model';
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

    public async loadNames(names: NameModel[]) {
        await spreadsheetDB.names.clear();
        await spreadsheetDB.names.bulkAdd(names);
    }

    public async update(name: IName) {
        await spreadsheetDB.names.put(name);
    }
}