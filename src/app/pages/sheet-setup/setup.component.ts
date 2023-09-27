import { Component, ViewChild } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { SheetAddFormComponent } from './sheet-add-form/sheet-add-form.component';
import { TimerService } from '@services/timer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GigLoggerService } from '@services/gig-logger.service';
import { CommonService } from '@services/common.service';

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
  defaultSheet: ISpreadsheet | undefined;

  constructor(
    private _snackBar: MatSnackBar,
    private _commonService: CommonService,
    private _gigLoggerService: GigLoggerService,
    private _spreadsheetService: SpreadsheetService,
    private _timerService: TimerService
  ) { }

  async ngOnInit(): Promise<void> {
    this.load();
    await this._spreadsheetService.showEstimatedQuota();
  }

  public async load() {
    this.spreadsheets = await this._spreadsheetService.getSpreadsheets();
    this.defaultSheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
    this.updateHeader();
  }

  public async reload() {
    if (!this.defaultSheet?.id) {
      return;
    }

    this.reloading = true;
    await this._spreadsheetService.loadSpreadsheetData();
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

    if (!this.defaultSheet?.id) {
      this._snackBar.open("Please Reload Manually");
      return;
    }

    this._snackBar.open("Connecting to Spreadsheet");

    await this.reload();

    this.deleting = false;
    this.reloading = false;
    this.setting = false;
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

  private updateHeader(){
    this._commonService.updateHeaderLink("New User");
   }
}
