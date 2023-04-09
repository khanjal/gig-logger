import { liveQuery } from 'dexie';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { localDB } from '@data/local.db';
import { Spreadsheet } from '@models/spreadsheet.model';

export class SpreadsheetService {
    spreadsheets$ = liveQuery(() => localDB.spreadsheets.toArray());
    
    public async add(spreadsheet: Spreadsheet) {
        await localDB.spreadsheets.add(spreadsheet);
    }

    public async querySpreadsheets(field: string, value: string | number): Promise<ISpreadsheet[]> {
        return await localDB.spreadsheets.where(field).equals(value).toArray();
    }

    public async getSpreadsheets(): Promise<ISpreadsheet[]> {
        return await localDB.spreadsheets.toArray();
    }

    public async update(spreadsheet: Spreadsheet) {
        await localDB.spreadsheets.put(spreadsheet);
    }
}