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
import { createAsyncOperationState } from '@helpers/async-operation-state.helper';

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
  readonly deletingState = createAsyncOperationState();
  readonly reloadingState = createAsyncOperationState();
  readonly settingState = createAsyncOperationState();
  deleting = this.deletingState.isLoading;
  reloading = this.reloadingState.isLoading;
  setting = this.settingState.isLoading;
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
    const defaultSheets = await this._spreadsheetService.querySpreadsheets("default", "true");
    this.defaultSheet.set(defaultSheets?.[0]);
    this.updateHeader();
  }

  public async reload() {
    await this.load();
    if (!this.defaultSheet()?.id) {
      return;
    }

    this.reloadingState.setLoading();
    try {
      await this.loadSheetDialog('load');
      this.reloadingState.setSuccess();
    } catch (error) {
      this.reloadingState.setError('Reload failed');
      throw error;
    }
  }

  public async setDefault(spreadsheet: ISpreadsheet) {
    this.settingState.setLoading();
    try {
      // Make current default not default
      const defaultSheets = await this._spreadsheetService.querySpreadsheets("default", "true");
      const defaultSpreadsheet = defaultSheets?.[0];
      
      if (defaultSpreadsheet) {
        defaultSpreadsheet.default = "false";
        await this._spreadsheetService.update(defaultSpreadsheet);
      }

      spreadsheet.default = "true";
      await this._spreadsheetService.update(spreadsheet);
      await this.load();
      await this.reload();
      this.settingState.setSuccess();
    } catch (error) {
      this.settingState.setError('Set default failed');
      throw error;
    }
  }

  public async unlinkSpreadsheet(spreadsheet: ISpreadsheet) {
    this.deletingState.setLoading();
    try {
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
        this.deletingState.setSuccess();
        return;
      } else {
        // Non-default sheet, just unlink it
        await this._spreadsheetService.deleteSpreadsheet(spreadsheet);
      }

      await this.load();
      this.deletingState.setSuccess();
    } catch (error) {
      this.deletingState.setError('Unlink failed');
      throw error;
    }
  }

  public async deleteAllData() {
    this.deletingState.setLoading();
    try {
      this._spreadsheetService.deleteData();

      await this._timerService.delay(1000);

      this.spreadsheets.set([]);
      await this.load();
      this.deletingState.setSuccess();
    } catch (error) {
      this.deletingState.setError('Delete failed');
      throw error;
    }
  }

  public async deleteAndReload() {
    this.deletingState.setLoading();
    this.reloadingState.setLoading();
    this.settingState.setLoading();

    try {
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
        this.deletingState.setSuccess();
        this.reloadingState.setSuccess();
        this.settingState.setSuccess();
        return;
      }

      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.CONNECTING_TO_SPREADSHEET);

      await this.reload();

      this.deletingState.setSuccess();
      this.reloadingState.setSuccess();
      this.settingState.setSuccess();
    } catch (error) {
      this.deletingState.setError('Delete and reload failed');
      this.reloadingState.setError('Delete and reload failed');
      this.settingState.setError('Delete and reload failed');
      throw error;
    }
  }

  public async deleteLocalData() {
    this.deletingState.setLoading();
    try {
      this._spreadsheetService.deleteLocalData();
      localStorage.clear();

      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.ALL_DATA_DELETED);

      await this.load();
      this.deletingState.setSuccess();
    } catch (error) {
      this.deletingState.setError('Delete local data failed');
      throw error;
    }
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
