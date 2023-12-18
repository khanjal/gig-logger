import { liveQuery } from 'dexie';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { localDB } from '@data/local.db';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GigLoggerService } from './gig-logger.service';
import { ISheet } from '@interfaces/sheet.interface';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SpreadsheetService {
    spreadsheets$ = liveQuery(() => localDB.spreadsheets.toArray());

    constructor(
        private _snackBar: MatSnackBar,
        private _gigLoggerService: GigLoggerService,
    ) { }
    
    public async add(spreadsheet: ISpreadsheet) {
        await localDB.spreadsheets.add(spreadsheet);
    }

    public async findSheet(id: string): Promise<ISpreadsheet | undefined> {
        return await localDB.spreadsheets.where("id").anyOfIgnoreCase(id).first();
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

    public async warmUpLambda() {
        // Wake up lambda
        //console.log("Warming up lambda");
        await firstValueFrom(await this._gigLoggerService.warmupLambda("none"));
    }

    public async loadSpreadsheetData() {
        // Load primary spreadsheet data.
        let primarySpreadsheet = await this.getDefaultSheet();

        //console.log("Loading default data");
        this._snackBar.open(`Connecting to ${primarySpreadsheet.name} Spreadsheet`);

        let data = await firstValueFrom(await this._gigLoggerService.getSheetData(primarySpreadsheet.id));
        this.updateSheetSize(primarySpreadsheet.id, data);
        
        this._snackBar.open("Loading Primary Spreadsheet Data");
        await this._gigLoggerService.loadData(<ISheet>data);
        this._snackBar.open("Loaded Primary Spreadsheet Data");

        await this.appendSpreadsheetData();

        //console.log("Done")
    }

    public async appendSpreadsheetData() {
        // Append secondary spreadsheets.
        let secondarySpreadsheets = (await this.getSpreadsheets()).filter(x => x.default !== "true");
        // console.log(secondarySpreadsheets.length);
        for (const secondarySpreadsheet of secondarySpreadsheets) {
            // console.log(secondarySpreadsheet.name);
            this._snackBar.open(`Connecting to ${secondarySpreadsheet.name} Spreadsheet`);
            let data = await firstValueFrom(await this._gigLoggerService.getSecondarySheetData(secondarySpreadsheet.id));
            this.updateSheetSize(secondarySpreadsheet.id, data);
            this._snackBar.open("Loading Secondary Spreadsheet Data");
            await this._gigLoggerService.appendData(<ISheet>data);
            this._snackBar.open("Loaded Secondary Spreadsheet Data");
        };
    }

    public async showEstimatedQuota(): Promise<StorageEstimate | undefined> {
        if (navigator.storage && navigator.storage.estimate) {
            const estimation = await navigator.storage.estimate();
            // console.log(`Quota: ${NumberHelper.getDataSize(estimation.quota)}`);
            // console.log(`Usage: ${NumberHelper.getDataSize(estimation.usage)}`);

            return estimation;
        } else {
            console.error("StorageManager not found");
        }

        return;
    }

    private async updateSheetSize(sheetId: string, data: any){
        let sheet = await this.findSheet(sheetId);
        if (!sheet) return;
        sheet.size = new TextEncoder().encode(JSON.stringify(data)).length;
        
        this.update(sheet);
    }
}