import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { NameModel } from '@models/name.model';
import { IName } from '@interfaces/name.interface';

export class NameService {
    names$ = liveQuery(() => spreadsheetDB.names.toArray());
    
    public async getRemoteNames(): Promise<IName[]> {
        return await spreadsheetDB.names.toArray();
    }

    public async loadNames(names: NameModel[]) {
        await spreadsheetDB.names.clear();
        await spreadsheetDB.names.bulkAdd(names);
    }
}