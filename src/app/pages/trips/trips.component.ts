import { Component, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { ViewportScroller, NgIf, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { isDemoSheetName } from '@constants/sheet.constants';
import { UI_MESSAGES } from '@constants/ui-message.constants';
import { openSnackbar } from '@utils/snackbar.util';

import { DateHelper } from '@helpers/date.helper';

import { ActionEnum } from '@enums/action.enum';

import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { ITrip } from '@interfaces/trip.interface';

import { PollingService } from '@services/polling.service';
import { UiPreferencesService } from '@services/ui-preferences.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { LoggerService } from '@services/logger.service';

import { CurrentAverageComponent } from '@components/analysis/current-average/current-average.component';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { TripFormComponent } from '@components/trips/trip-form/trip-form.component';
import { TripsTableGroupComponent } from '@components/trips/trips-table-group/trips-table-group.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';

import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';
import { TruncatePipe } from "@pipes/truncate.pipe";
import { BackToTopComponent } from '@components/ui/back-to-top/back-to-top.component';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { AuthGoogleService } from '@services/auth-google.service';


@Component({
    selector: 'app-trip',
    templateUrl: './trips.component.html',
    styleUrls: ['./trips.component.scss'],
    standalone: true,
    imports: [CommonModule, CurrentAverageComponent, TripFormComponent, MatIcon, MatSlideToggle, TripsQuickViewComponent, NgIf, TripsTableGroupComponent, TruncatePipe, BackToTopComponent, MatDialogModule, BaseRectButtonComponent]
})

export class TripComponent implements OnInit, OnDestroy {
  @ViewChild(TripFormComponent) tripForm:TripFormComponent | undefined;
  @ViewChild(TripsTableGroupComponent) tripsTable:TripsTableGroupComponent | undefined;

  clearing = signal(false);
  reloading = signal(false);
  saving = signal(false);
  syncInProgress = signal(false);
  pollingEnabled = signal(false);
  showYesterdayTrips = signal(false); // Controls the visibility of yesterday's trips section
  // Edit mode properties
  isEditMode = signal(false);
  editingTripId = signal<string | null>(null);
  isLoading = signal(false); // General loading overlay state

  savedTrips: ITrip[] = [];
  todaysTrips = signal<ITrip[]>([]);
  yesterdaysTrips = signal<ITrip[]>([]);
  unsavedData = signal(false);
  demoSheetAttached = signal(false);

  defaultSheet = signal<ISpreadsheet | undefined>(undefined);
  actionEnum = ActionEnum;
  protected readonly uiMessages = UI_MESSAGES;
  
  // Destroy subject for managing subscription cleanup
  private destroy$ = new Subject<void>();

  constructor(
      public dialog: MatDialog,
      private _snackBar: MatSnackBar,
      private _sheetService: SpreadsheetService,
      private _tripService: TripService,
      private _shiftService: ShiftService,
      private unsavedDataService: UnsavedDataService,
      private _viewportScroller: ViewportScroller,
      private _pollingService: PollingService,
      private _uiPreferences: UiPreferencesService,
      private logger: LoggerService,
      private _route: ActivatedRoute,
      private _router: Router,
      protected authService: AuthGoogleService
    ) { }
  ngOnDestroy(): void {
    // Complete the destroy subject to trigger takeUntil in all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnInit(): Promise<void> {
    const initialTripId = this._route?.snapshot?.paramMap?.get('id') ?? null;
    this.isEditMode.set(!!initialTripId);
    this.editingTripId.set(initialTripId);

    // Check if we're in edit mode based on route with automatic cleanup
    this._route?.paramMap
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const tripId = params.get('id');
        if (tripId) {
          this.isEditMode.set(true);
          this.editingTripId.set(tripId);
        } else {
          this.isEditMode.set(false);
          this.editingTripId.set(null);
        }
      });

    // Sync polling preference via UiPreferencesService
    this._uiPreferences.pollingEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        this.pollingEnabled.set(enabled);
      });

    this._tripService.trips$
      .pipe(takeUntil(this.destroy$))
      .subscribe(trips => {
        this.syncTripLists(trips);
        if (!this.isEditMode()) {
          this.scheduleTripsTableReload();
          this.scheduleTripFormReload();
        }
      });

    this._shiftService.shifts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isEditMode()) {
          this.scheduleTripFormReload();
        }
      });

    this.unsavedDataService.unsavedData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasUnsaved => this.unsavedData.set(hasUnsaved));

    // Only load if not in edit mode
    if (!this.isEditMode()) {
      await this.load();
      // Start polling if enabled and not in edit mode
      if (this.pollingEnabled()) {
        await this.startPolling();
      }
    }
    await this.refreshDefaultSheetState();
    
    // Load trip data for editing if in edit mode
    if (this.isEditMode() && this.editingTripId()) {
      await this.loadTripForEditing();
    }
  }

  public async load(showSpinner: boolean = true) {
    // Prevent reload if editing form
    if (this.editingTripId()) return;
    if (showSpinner) {
      this.isLoading.set(true);
    }
    try {
      await this.refreshUnsavedData();
      this.scheduleTripsTableReload();
      this.scheduleTripFormReload();
    } catch (error) {
      this.logger.error('Failed to load trips page data', error);
    } finally {
      if (showSpinner) {
        setTimeout(() => {
          this.isLoading.set(false);
        }, 400);
      }
    }
  }

  private scheduleTripsTableReload(): void {
    if (this.syncInProgress()) {
      return;
    }

    setTimeout(() => {
      void this.tripsTable?.load();
    }, 0);
  }

  private scheduleTripFormReload(): void {
    if (this.saving() || this.syncInProgress()) {
      return;
    }

    setTimeout(() => {
      void this.tripForm?.load();
    }, 0);
  }

  private syncTripLists(trips: ITrip[]): void {
    const today = DateHelper.toISO(DateHelper.getDateFromDays());
    const yesterday = DateHelper.toISO(DateHelper.getDateFromDays(1));

    const todaysTrips = trips
      .filter(trip => trip.date === today)
      .sort((left, right) => (right.rowId ?? 0) - (left.rowId ?? 0));
    const yesterdaysTrips = trips
      .filter(trip => trip.date === yesterday)
      .sort((left, right) => (left.rowId ?? 0) - (right.rowId ?? 0));

    this.todaysTrips.set(todaysTrips);
    this.yesterdaysTrips.set(yesterdaysTrips);
  }

  private async refreshUnsavedData(): Promise<void> {
    this.unsavedData.set(await this.unsavedDataService.hasUnsavedData());
  }



  // Toggle yesterday's trips visibility
  toggleYesterdayTrips(): void {
    this.showYesterdayTrips.update(show => !show);
  }

  // Scroll to today's trips section or specific trip
  scrollToTrip(tripId?: string): void {
    if (tripId) {
      // Scroll to specific trip by ID with offset
      const element = document.getElementById(tripId);
      if (element) {
        // Calculate position with offset (80px above the element)
        const elementPosition = element.offsetTop;
        const offsetPosition = elementPosition - 80;
        
        // Scroll to the calculated position
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        // Fallback to scrolling to today's trips section
        this._viewportScroller.scrollToAnchor("todaysTrips");
      }
    } else {
      // Scroll to today's trips section
      this._viewportScroller.scrollToAnchor("todaysTrips");
    }
  }

  async loadSheetDialog(inputValue: string) {
    const canSync = await this.authService.canSync();
    if (!canSync) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOGIN_TO_SYNC_CHANGES, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

    this.syncInProgress.set(true);
    try {
      const dialogRef = this.dialog.open(DataSyncModalComponent, {
          panelClass: 'custom-modalbox',
          data: inputValue
      });
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        await this.reload("todaysTrips");
      }
    } finally {
      this.syncInProgress.set(false);
    }
  }

  async saveSheetDialog(inputValue: string) {
    const canSync = await this.authService.canSync();
    if (!canSync) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOGIN_TO_SYNC_CHANGES, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

    this.saving.set(true);
    this.syncInProgress.set(true);
    try {
      const dialogRef = this.dialog.open(DataSyncModalComponent, {
          panelClass: 'custom-modalbox',
          data: inputValue
      });
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        openSnackbar(this._snackBar, SNACKBAR_MESSAGES.TRIPS_SAVED_TO_SPREADSHEET);
        this._viewportScroller.scrollToAnchor("todaysTrips");
      }
    } finally {
      this.syncInProgress.set(false);
      this.saving.set(false);
    }
  }
    
  async confirmSaveTripsDialog() {
    const message = `This will save all changes to your spreadsheet. This process will take less than a minute.`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Save";
    dialogData.message = message;
    dialogData.trueText = "Save";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.saveSheetDialog('save');
    }
  }

  async confirmLoadTripsDialog() {
    // Stop polling while dialog is open
    this.stopPolling();
    const message = `This will load all changes from your spreadsheet. This process will take less than a minute.`;

    let dialogData: IConfirmDialog = {} as IConfirmDialog;
    dialogData.title = "Confirm Load";
    dialogData.message = message;
    dialogData.trueText = "Load";
    dialogData.falseText = "Cancel";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result) {
        await this.loadSheetDialog('load');
      }
      // Resume polling if appropriate
      if (this.pollingEnabled() && !this.isEditMode()) {
        await this.startPolling();
      }
    });
  }

  async reload(anchor?: string, isParentReload: boolean = false) {
    await this.refreshDefaultSheetState();
    let sheetId = this.defaultSheet()?.id;
    if (!sheetId) {
      return;
    }

    this.reloading.set(true);
    try {
      await this.load(!isParentReload); // Don't show spinner if it's a parent reload
    } catch (err) {
      this.logger.error('Error during reload:', err);
    } finally {
      this.reloading.set(false);
    }

    if (anchor) {
      this._viewportScroller.scrollToAnchor(anchor);
    }
  }
  
  async changePolling() {
    await this._uiPreferences.togglePolling();
  }

  async startPolling() {
    // Only poll if pollingEnabled and not in edit mode
    if (!this.pollingEnabled() || this.isEditMode()) {
      return;
    }
    
    // Check if polling is already running to avoid unnecessary stop/start
    if (this._pollingService.isPollingEnabled()) {
      this.logger.debug('Polling already running, skipping start');
      return;
    }
    
    this.logger.debug('Starting polling');
    await this._pollingService.startPolling();
  }
  stopPolling() {
    this.logger.debug('Stopping polling');
    this._pollingService.stopPolling();
  }

  async loadTripForEditing() {
    if (!this.editingTripId()) return;
    
    this.isLoading.set(true);
    
    try {
      const tripId = parseInt(this.editingTripId()!);
      const trip = await this._tripService.getByRowId(tripId);
      if (trip && this.tripForm) {
        this.tripForm.data = trip;
        await this.tripForm.load();
      }
    } catch (error) {
      this.logger.error('Error loading trip for editing:', error);
      this._router.navigate(['/trips']);
    }
    
    // Small delay for smooth transition
    setTimeout(() => {
      this.isLoading.set(false);
    }, 200);
  }
  
  async exitEditMode(scrollToTripId?: string) {
    this.editingTripId.set(null);
    this._router.navigate(['/trips']);
    if (this.tripForm) {
      await this.tripForm.formReset();
    }
    await this.load(); // This handles the overlay timing
    this.isEditMode.set(false);
    this.scheduleTripsTableReload();
    this.scheduleTripFormReload();
    if (this.pollingEnabled()) {
      await this.startPolling();
    }
    if (scrollToTripId) {
      this.scrollToTrip(scrollToTripId);
    } else {
      this.scrollToTrip();
    }
  }

  shouldShowUpdateMessage(): boolean {
    return this.todaysTrips().length === 0;
  }

  private async refreshDefaultSheetState(): Promise<void> {
    this.defaultSheet.set((await this._sheetService.querySpreadsheets("default", "true"))[0]);
    this.demoSheetAttached.set(isDemoSheetName(this.defaultSheet()?.name));
  }
}
