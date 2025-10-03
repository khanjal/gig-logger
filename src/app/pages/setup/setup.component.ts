// Angular Core
import { Component, ViewChild } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';

// Angular Material
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

// App Components
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { DiagnosticsComponent } from '@components/settings/diagnostics/diagnostics.component';
import { LoginComponent } from "@components/auth/login/login.component";
import { ServiceWorkerStatusComponent } from '@components/data/service-worker-status/service-worker-status.component';
import { SheetAddFormComponent } from './sheet-add-form/sheet-add-form.component';
import { SheetLinkComponent } from './sheet-link/sheet-link.component';
import { SheetQuickViewComponent } from './sheet-quick-view/sheet-quick-view.component';
import { SheetQuotaComponent } from './sheet-quota/sheet-quota.component';
import { LocationPermissionComponent } from '../../shared/components/location-permission/location-permission.component';

// App Interfaces
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';

// App Services
import { AuthGoogleService } from '@services/auth-google.service';
import { VersionService } from '@services/version.service';
import { CommonService } from '@services/common.service';
import { LoggerService } from '@services/logger.service';
import { ShiftService } from '@services/sheets/shift.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/sheets/trip.service';
import { AuthStatusComponent } from "@components/auth/auth-status/auth-status.component";

@Component({
    selector: 'app-setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.scss'],
    standalone: true,
    imports: [
    CommonModule,
    NgIf,
    NgFor,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatFabButton,
    MatIcon,
    DiagnosticsComponent,
    LoginComponent,
    ServiceWorkerStatusComponent,
    SheetLinkComponent,
    SheetQuickViewComponent,
    SheetQuotaComponent,
    AuthStatusComponent,
    LocationPermissionComponent
]
})
export class SetupComponent {
  @ViewChild(SheetAddFormComponent) form:SheetAddFormComponent | undefined;

  isAuthenticated = false;
  deleting: boolean = false;
  reloading: boolean = false;
  setting: boolean = false;
  spreadsheets: ISpreadsheet[] | undefined;
  defaultSheet: ISpreadsheet | undefined;
  unsavedData: boolean = false;

  version: string = '';

  constructor(
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private _commonService: CommonService,
    private _logger: LoggerService,
    private _spreadsheetService: SpreadsheetService,
    private _shiftService: ShiftService,
    private _tripService: TripService,
    private _timerService: TimerService,
    protected authService: AuthGoogleService,
    private versionService: VersionService
  ) { }


  async ngOnInit(): Promise<void> {
    this.isAuthenticated = await this.authService.isAuthenticated();
    this.load();
    // Load formatted version string (YYYYMMDD.build)
    this.version = await this.versionService.getFormattedVersion();
  }

  public async load() {
    this.unsavedData = (await this._tripService.getUnsaved()).length > 0 || (await this._shiftService.getUnsavedShifts()).length > 0;
    this.spreadsheets = await this._spreadsheetService.getSpreadsheets();
    this.defaultSheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
    this.updateHeader();
  }

  public async reload() {
    await this.load();
    if (!this.defaultSheet?.id) {
      return;
    }

    this.reloading = true;
    await this.loadSheetDialog('load');
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

    this.reload();
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
      this._logger.info(`Adding spreadsheet: ${spreadsheet.name}`);
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

    this._snackBar.open("All Data Deleted");

    await this.load();
  }
  public getDataSize() {
    /**
     * Data size calculation placeholder
     * Future implementation: Create LocalStorageHelper utility to calculate
     * total storage usage across all IndexedDB stores and localStorage
     * Should return formatted string like "2.5 MB" or "500 KB"
     */
    return "0 bytes";
  }

  private updateHeader(){
    this._commonService.updateHeaderLink("New User");
  }

  async loadSheetDialog(inputValue: string) {
        let dialogRef = this.dialog.open(DataSyncModalComponent, {
            height: '400px',
            width: '500px',
            panelClass: 'custom-modalbox',
            data: inputValue
        });
  
        dialogRef.afterClosed().subscribe(async result => {
  
            if (result) {
                await this.load();
            }
        });
    }

  async confirmDeleteAndReloadDialog() {
    const message = `Reloading will fetch data from the spreadsheet and <strong>WILL NOT</strong> preserve any unsaved local changes. Please ensure all your data is saved before proceeding.`;

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
