// Angular Core
import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';

// Angular Material
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

// App Components
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { LoginComponent } from "@components/auth/login/login.component";
import { ServiceWorkerStatusComponent } from '@components/data/service-worker-status/service-worker-status.component';
import { SheetAddFormComponent } from './sheet-add-form/sheet-add-form.component';
import { SheetLinkComponent } from './sheet-link/sheet-link.component';
import { SheetDemoComponent } from './sheet-demo/sheet-demo.component';
import { SheetQuickViewComponent } from './sheet-quick-view/sheet-quick-view.component';
import { SheetQuotaComponent } from './sheet-quota/sheet-quota.component';
import { PermissionsComponent } from '@components/permissions/permissions.component';
import { LocationOverrideComponent } from '@components/location-override/location-override.component';

// App Interfaces
import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';

// App Services
import { AuthGoogleService } from '@services/auth-google.service';
import { VersionService } from '@services/version.service';
import { CommonService } from '@services/common.service';
import { LoggerService } from '@services/logger.service';
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { ShiftService } from '@services/sheets/shift.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/sheets/trip.service';
import { AuthStatusComponent } from "@components/auth/auth-status/auth-status.component";
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { BaseCardComponent } from '@components/base/base-card/base-card.component';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.scss'],
    standalone: true,
    imports: [
      CommonModule,
      NgIf,
      NgFor,
      MatIcon,
      LoginComponent,
      ServiceWorkerStatusComponent,
      SheetLinkComponent,
      SheetDemoComponent,
      SheetQuickViewComponent,
      SheetQuotaComponent,
      AuthStatusComponent,
      PermissionsComponent,
      LocationOverrideComponent,
      BaseRectButtonComponent,
      BaseCardComponent
  ]
})
export class SetupComponent {
  @ViewChild(SheetAddFormComponent) form:SheetAddFormComponent | undefined;

  isAuthenticated = signal(false);
  deleting = signal(false);
  reloading = signal(false);
  setting = signal(false);
  spreadsheets = signal<ISpreadsheet[] | undefined>(undefined);
  defaultSheet = signal<ISpreadsheet | undefined>(undefined);
  unsavedData = signal(false);
  showAdvanced = signal(false);

  version = signal('');

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
    this.isAuthenticated.set(await this.authService.canSync());
    await this.load();
    // Load formatted version string (YYYYMMDD.build)
    this.version.set(await this.versionService.getFormattedVersion());

    // Append environment suffix for test subdomain installs
    try {
      const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
      if (host && (host.indexOf('gig-test') !== -1 || host.indexOf('test.gig') !== -1 || host.indexOf('test') !== -1)) {
        this.version.set(`${this.version()}-test`);
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Handles setup child events and avoids duplicate sync operations.
   * create-sheet/create-demo already load data in the modal, so only refresh local sheet state.
   */
  public async handleParentReload(event?: { mode?: 'load-only' | 'reload' }): Promise<void> {
    if (event?.mode === 'load-only') {
      await this.load();
      return;
    }

    await this.reload();
  }

  public async load() {
    this.unsavedData.set((await this._tripService.getUnsaved()).length > 0 || (await this._shiftService.getUnsavedShifts()).length > 0);
    this.spreadsheets.set(await this._spreadsheetService.getSpreadsheets());
    this.defaultSheet.set((await this._spreadsheetService.querySpreadsheets("default", "true"))[0]);
    this.updateHeader();
  }

  public async reload() {
    await this.load();
    if (!this.defaultSheet()?.id) {
      return;
    }

    this.reloading.set(true);
    await this.loadSheetDialog('load');
    this.reloading.set(false);
  }

  public async setDefault(spreadsheet: ISpreadsheet) {
    this.setting.set(true);
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
    this.setting.set(false);
  }

  public async unlinkSpreadsheet(spreadsheet: ISpreadsheet) {
    this.deleting.set(true);
    
    // Get all spreadsheets
    const allSpreadsheets = await this._spreadsheetService.getSpreadsheets();
    const isDefaultSheet = spreadsheet.default === "true";
    const isOnlySheet = allSpreadsheets.length === 1;

    if (isDefaultSheet && isOnlySheet) {
      // If it's the default and only sheet, clear all data (like Delete Data button)
      await this.deleteAllData();
    } else if (isDefaultSheet && !isOnlySheet) {
      // Cannot unlink default sheet when there are others - user must set another as default first
        openSnackbar(this._snackBar, SNACKBAR_MESSAGES.SET_ANOTHER_DEFAULT, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      this.deleting.set(false);
      return;
    } else {
      // Non-default sheet, just unlink it
      await this._spreadsheetService.deleteSpreadsheet(spreadsheet);
    }

    this.deleting.set(false);
    await this.load();
  }

  public async deleteAllData() {
    this.deleting.set(true);
    this._spreadsheetService.deleteData();

    await this._timerService.delay(1000);

    this.spreadsheets.set([]);
    this.deleting.set(false);

    await this.load();
  }

  public async deleteAndReload() {
    this.deleting.set(true);
    this.reloading.set(true);
    this.setting.set(true);
    
    // Store current spreadsheets.
    this.spreadsheets.set(await this._spreadsheetService.getSpreadsheets());
    this._spreadsheetService.deleteData();

    // Need a delay to delete DBs and reopen them.
    await this._timerService.delay(2000);

    // Add spreadsheets back to DB
    for (const spreadsheet of this.spreadsheets() ?? []) {
      this._logger.info(`Adding spreadsheet: ${spreadsheet.name}`);
      await this._spreadsheetService.update(spreadsheet);
    };

    if (!this.defaultSheet()?.id) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.RELOAD_MANUALLY);
      return;
    }

    openSnackbar(this._snackBar, SNACKBAR_MESSAGES.CONNECTING_TO_SPREADSHEET);

    await this.reload();

    this.deleting.set(false);
    this.reloading.set(false);
    this.setting.set(false);
  }

  public async deleteLocalData() {
    this.deleting.set(true);
    this._spreadsheetService.deleteLocalData();
    this.deleting.set(false);
    localStorage.clear();

    openSnackbar(this._snackBar, SNACKBAR_MESSAGES.ALL_DATA_DELETED);

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
    const canSync = await this.authService.canSync();
    if (!canSync) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOGIN_TO_LOAD_SAVE, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

    const dialogRef = this.dialog.open(DataSyncModalComponent, {
      panelClass: 'custom-modalbox',
      data: inputValue
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.load();
    }
  }

  async confirmDeleteAndReloadDialog() {
    const canSync = await this.authService.canSync();
    if (!canSync) {
        openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOGIN_TO_RELOAD, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

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

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.deleteAndReload();
    }
  }

  async confirmDeleteAllDialog() {
    const message = `This will delete everything except for what is saved in your spreadsheet. Are you sure?`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Delete All";
    dialogData.message = message;
    dialogData.trueText = "Delete All";
    dialogData.trueColor = "danger";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.deleteAllData();
    }
  }

  async confirmUnlinkSpreadsheetDialog(spreadsheet: ISpreadsheet) {
    const allSpreadsheets = await this._spreadsheetService.getSpreadsheets();
    const isDefaultSheet = spreadsheet.default === "true";
    const isOnlySheet = allSpreadsheets.length === 1;

    // Cannot unlink default sheet when there are other sheets
    if (isDefaultSheet && !isOnlySheet) {
        openSnackbar(this._snackBar, SNACKBAR_MESSAGES.SET_ANOTHER_DEFAULT, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

    let message = '';
    let title = '';
    let confirmText = '';

    if (isDefaultSheet && isOnlySheet) {
      // Last remaining sheet - will clear all data
      title = "Unlink Sheet & Clear Data";
      message = `Unlinking it will clear all local data. Your data will remain safe in the spreadsheet itself. Are you sure?`;
      confirmText = "Unlink & Clear Data";
    } else {
      // Non-default sheet
      title = "Unlink Spreadsheet";
      message = `This will unlink "${spreadsheet.name}" from the app. Your data will remain safe in the spreadsheet itself. Are you sure?`;
      confirmText = "Unlink";
    }

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = title;
    dialogData.message = message;
    dialogData.trueText = confirmText;
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.unlinkSpreadsheet(spreadsheet);
    }
  }
}
