import { Component, ViewChild } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { SheetAddFormComponent } from './sheet-add-form/sheet-add-form.component';
import { TimerService } from '@services/timer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '@services/common.service';
import { MatDialog } from '@angular/material/dialog';
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { MatIcon } from '@angular/material/icon';
import { NgIf, NgFor } from '@angular/common';
import { SheetQuickViewComponent } from './sheet-quick-view/sheet-quick-view.component';
import { MatFabButton } from '@angular/material/button';
import { SheetQuotaComponent } from './sheet-quota/sheet-quota.component';

@Component({
    selector: 'app-setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.scss'],
    standalone: true,
    imports: [MatIcon, SheetAddFormComponent, NgIf, NgFor, SheetQuickViewComponent, MatFabButton, SheetQuotaComponent]
})
export class SetupComponent {
  @ViewChild(SheetAddFormComponent) form:SheetAddFormComponent | undefined;

  deleting: boolean = false;
  reloading: boolean = false;
  setting: boolean = false;
  spreadsheets: ISpreadsheet[] | undefined;
  defaultSheet: ISpreadsheet | undefined;

  constructor(
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private _commonService: CommonService,
    private _spreadsheetService: SpreadsheetService,
    private _timerService: TimerService
  ) { }

  async ngOnInit(): Promise<void> {
    this.load();
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
    
    if (defaultSpreadsheet) {
      defaultSpreadsheet.default = "false";
      await this._spreadsheetService.update(defaultSpreadsheet);
    }

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
    for (const spreadsheet of this.spreadsheets) {
      console.log(`Adding spreadsheet: ${spreadsheet.name}`);
      await this._spreadsheetService.update(spreadsheet);
    };

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

  async confirmDeleteAndReloadDialog() {
    const message = `This will reload your data from the spreadsheet preserving your local unsaved data.`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Delete & Reload";
    dialogData.message = message;
    dialogData.trueText = "Delete & Reload";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result) {
        await this.deleteAndReload();
      }
    });
  }

  async confirmDeleteAllDialog() {
    const message = `This will delete everything except for what is saved in your spreadsheet. Are you sure?`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Delete All";
    dialogData.message = message;
    dialogData.trueText = "Delete All";
    dialogData.trueColor = "warning";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result) {
        await this.deleteAllData();
      }
    });
  }
}
