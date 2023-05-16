import { liveQuery } from 'dexie';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { localDB } from '@data/local.db';
import { spreadsheetDB } from '@data/spreadsheet.db';

export class SpreadsheetService {
    spreadsheets$ = liveQuery(() => localDB.spreadsheets.toArray());
    
    public async add(spreadsheet: ISpreadsheet) {
        await localDB.spreadsheets.add(spreadsheet);
    }

    public async getDefaultSheet(): Promise<ISpreadsheet> {
        return (await this.querySpreadsheets("default", "true"))[0];
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

    public deleteLocalData(): boolean {
        localDB.delete().then(() => {
            console.log("Local Database successfully deleted");
        }).catch((err) => {
            console.error("Could not delete local database");
        }).finally(async () => {
            localDB.open();
        });

        return true;
    }

    public deleteRemoteData() {
        spreadsheetDB.delete().then(() => {
            console.log("Spreadsheet Database successfully deleted");
            // spreadsheetDB.open();
        }).catch((err) => {
            console.error("Could not delete spreadsheet database");
        }).finally(async () => {
            spreadsheetDB.open();
        });

        return true;
    }

    public deleteData() {
        this.deleteLocalData();
        this.deleteRemoteData();
    }
}