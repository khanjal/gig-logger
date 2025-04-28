import { liveQuery } from 'dexie';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { localDB } from '@data/local.db';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GigLoggerService } from './gig-logger.service';
import { ISheet } from '@interfaces/sheet.interface';
import { Injectable } from '@angular/core';

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
        let defaultSheet = await this.getDefaultSheet();
        return await this._gigLoggerService.healthCheck(defaultSheet.id);
    }

    public async getSpreadsheetData(spreadsheet: ISpreadsheet) : Promise<ISheet>{
        let data = await this._gigLoggerService.getSheetData(spreadsheet.id);
        this.updateSheetName(spreadsheet.id, data);
        this.updateSheetSize(spreadsheet.id, data);
        return <ISheet>data;
    }

    public async loadSpreadsheetData(data: ISheet) {
        this._snackBar.open("Loading Primary Spreadsheet Data");
        
        await this._gigLoggerService.loadData(<ISheet>data);
        this._snackBar.open("Loaded Primary Spreadsheet Data");
    }

    public async appendSpreadsheetData(data: ISheet) {
        this._snackBar.open("Loading Secondary Spreadsheet Data");
        await this._gigLoggerService.appendData(<ISheet>data);
        this._snackBar.open("Loaded Secondary Spreadsheet Data");
    }

    private async updateSheetName(sheetId: string, data: any) {
        let sheet = await this.findSheet(sheetId);
        if (!sheet) return;

        if (sheet && data.properties.name) {
            sheet.name = data.properties.name;
            this.update(sheet);
        }
    }

    private async updateSheetSize(sheetId: string, data: any){
        let sheet = await this.findSheet(sheetId);
        if (!sheet) return;
        sheet.size = new TextEncoder().encode(JSON.stringify(data)).length;
        this.update(sheet);
    }
}