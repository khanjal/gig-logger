import { liveQuery } from 'dexie';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';
import { localDB } from '@data/local.db';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { GigWorkflowService } from './gig-workflow.service';
import { LoggerService } from './logger.service';
import type { ISheet } from '@interfaces/sheets/sheet.interface';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpreadsheetService {
    private _snackBar = inject(MatSnackBar);
    private _gigLoggerService = inject(GigWorkflowService);
    private _logger = inject(LoggerService);

    public spreadsheets$ = liveQuery(() => localDB.spreadsheets.toArray());
    
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

    public async deleteLocalData(): Promise<void> {
        // db.delete() closes the connection (disabling auto-open) before calling
        // indexedDB.deleteDatabase(), which drops every object store and its
        // auto-increment counters - open() below then re-runs the full version().stores()
        // chain against a nonexistent DB, recreating every table empty from scratch.
        try {
            await localDB.delete();
            this._logger.info("Local Database successfully deleted");
        } catch (err) {
            this._logger.error("Could not delete local database", err);
        } finally {
            await localDB.open();
        }
    }

    public async deleteRemoteData(): Promise<void> {
        try {
            await spreadsheetDB.delete();
            this._logger.info("Spreadsheet Database successfully deleted");
        } catch (err) {
            this._logger.error("Could not delete spreadsheet database", err);
        } finally {
            await spreadsheetDB.open();
        }
    }

    public async deleteData(): Promise<void> {
        await Promise.all([this.deleteLocalData(), this.deleteRemoteData()]);
    }

    public async warmUpLambda() {
        // Wake up lambda
        this._logger.debug("Warming up lambda");
        const defaultSheet = await this.getDefaultSheet();
        return await this._gigLoggerService.healthCheck(defaultSheet.id);
    }

    public async getSpreadsheetData(spreadsheet: ISpreadsheet) : Promise<ISheet | null>{
        const data = await this._gigLoggerService.getSheetData(spreadsheet.id);
        if (!data) {
            return null;
        }

        await this.updateSheetInfo(spreadsheet.id, data);
        return data;
    }

    public async loadSpreadsheetData(data: ISheet) {
        openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOADING_PRIMARY_SPREADSHEET);
        
            await this._gigLoggerService.loadData((data as ISheet));
                openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOADED_PRIMARY_SPREADSHEET);
    }

    public async appendSpreadsheetData(data: ISheet) {
            openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOADING_SECONDARY_SPREADSHEET);
            await this._gigLoggerService.appendData((data as ISheet));
            openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOADED_SECONDARY_SPREADSHEET);
    }

    private async updateSheetInfo(sheetId: string, data: ISheet & { _source?: string }){
        const sheet = await this.findSheet(sheetId);
        if (!sheet) return;
        sheet.size = new TextEncoder().encode(JSON.stringify(data)).length;
        sheet.name = `${sheetId.substring(0, 10)}...`;

        if (data.properties.name) {
            sheet.name = data.properties.name;
        }

        // Persist source if provided by the API (tagged as `_source`)
        if (data._source) {
            sheet.source = data._source;
        }

        await this.update(sheet);
    }
}