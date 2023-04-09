import { liveQuery } from 'dexie';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { localDB } from '@data/local.db';
import { Spreadsheet } from '@models/spreadsheet.model';
import { spreadsheetDB } from '@data/spreadsheet.db';

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

    public async update(spreadsheet: ISpreadsheet) {
        await localDB.spreadsheets.put(spreadsheet);
    }

    public async deleteSpreadsheet(spreadsheet: ISpreadsheet) {
        await localDB.spreadsheets.delete(spreadsheet.id);
    }

    public deleteData() {
        localDB.delete().then(() => {
            console.log("Local Database successfully deleted");
        }).catch((err) => {
            console.error("Could not delete local database");
        }).finally(() => {
            // Do what should be done next...
        });

        spreadsheetDB.delete().then(() => {
            console.log("Spreadsheet Database successfully deleted");
        }).catch((err) => {
            console.error("Could not delete spreadsheet database");
        }).finally(() => {
            // Do what should be done next...
        });
    }
}