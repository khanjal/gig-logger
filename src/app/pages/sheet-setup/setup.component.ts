import { Component, ViewChild } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { GoogleSheetService } from '@services/googleSheet.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { SheetAddFormComponent } from './sheet-add-form/sheet-add-form.component';
import { TimerService } from '@services/timer.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent {
  @ViewChild(SheetAddFormComponent) form:SheetAddFormComponent | undefined;

  deleting: boolean = false;
  reloading: boolean = false;
  setting: boolean = false;
  spreadsheets: ISpreadsheet[] | undefined;

  constructor(
    private _snackBar: MatSnackBar,
    private _googleSheetService: GoogleSheetService,
    private _spreadsheetService: SpreadsheetService,
    private _timerService: TimerService
  ) { }

  async ngOnInit(): Promise<void> {
    this.load();
  }

  public async load() {
    this.spreadsheets = await this._spreadsheetService.getSpreadsheets();
  }

  public async reload() {
    this.reloading = true;
    await this._googleSheetService.loadRemoteData();
    this.reloading = false;
  }

  public async setDefault(spreadsheet: ISpreadsheet) {
    this.setting = true;
    // Make current default not default
    let defaultSpreadsheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
    defaultSpreadsheet.default = "false";
    await this._spreadsheetService.update(defaultSpreadsheet);

    spreadsheet.default = "true";
    await this._spreadsheetService.update(spreadsheet);
    this.load();
    this.reload();
    this.setting = false;
  }

  public async deleteSpreadsheet(spreadsheet: ISpreadsheet) {
    this.deleting = true;
    if (spreadsheet.default === "false") {
      await this._spreadsheetService.deleteSpreadsheet(spreadsheet);
    }

    this.deleting = false;

    this.load();
  }

  public async deleteAllData() {
    this.deleting = true;
    this._spreadsheetService.deleteData();

    await this._timerService.delay(1000);

    this.spreadsheets = [];
    this.deleting = false;

    await this.load();
  }

  public async deleteAndReload() {
    this.deleting = true;
    this.reloading = true;
    this.setting = true;
    
    // Store current spreadsheets.
    this.spreadsheets = await this._spreadsheetService.getSpreadsheets();
    this._spreadsheetService.deleteData();

    // Need a delay to delete DBs and reopen them.
    await this._timerService.delay(2000);

    // Add spreadsheets back to DB
    this.spreadsheets?.forEach(async spreadsheet => {
      console.log(`Adding spreadsheet: ${spreadsheet.name}`);
      await this._spreadsheetService.update(spreadsheet);
    });

    // Load default spreadsheet data.
    await this._googleSheetService.loadRemoteData();
    
    //await this._timerService.delay(10000);
    this.deleting = false;
    this.reloading = false;
    this.setting = false;

    this._snackBar.open("Databases and Spreadsheet(s) Loaded");

    await this.load();
  }

  public async deleteLocalData() {
    this.deleting = true;
    this._spreadsheetService.deleteLocalData();
    this.deleting = false;

    localStorage.clear();
    // window.location.reload();

    this._snackBar.open("All Data Deleted");

    await this.load();
  }

  public getDataSize() {
    // return LocalStorageHelper.formatBytes(LocalStorageHelper.getDataSize());
  }
}
