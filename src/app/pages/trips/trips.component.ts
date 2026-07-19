import type { OnDestroy, OnInit} from '@angular/core';
import { Component, ViewChild, signal, computed, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';

// Angular Material + Router
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';

// Constants / utils
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { isDemoSheetName } from '@constants/sheet.constants';
import { UI_MESSAGES } from '@constants/ui-message.constants';
import { openSnackbar } from '@utils/snackbar.util';

// Helpers / enums
import { DateHelper } from '@helpers/date.helper';
import { ActionEnum } from '@enums/action.enum';

// Services
import { PollingService } from '@services/polling.service';
import { UiPreferencesService } from '@services/ui-preferences.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { LoggerService } from '@services/logger.service';
import { AuthGoogleService } from '@services/auth-google.service';

// Components / pipes
import { CurrentAverageComponent } from '@components/analysis/current-average/current-average.component';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { TripFormComponent } from '@components/trips/trip-form/trip-form.component';
import { TripsTableGroupComponent } from '@components/trips/trips-table-group/trips-table-group.component';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';
import { BackToTopComponent } from '@components/ui/back-to-top/back-to-top.component';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { TruncatePipe } from '@pipes/truncate.pipe';

// RxJS
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Type-only imports
import type { IConfirmDialog } from '@interfaces/ui/confirm-dialog.interface';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';
import type { ITrip } from '@interfaces/entities/trip.interface';


@Component({
    selector: 'app-trip',
    templateUrl: './trips.component.html',
    styleUrls: ['./trips.component.scss'],
    standalone: true,
    imports: [CurrentAverageComponent, TripFormComponent, MatIcon, MatSlideToggle, TripsQuickViewComponent, TripsTableGroupComponent, TruncatePipe, BackToTopComponent, MatDialogModule, BaseRectButtonComponent]
})

export class TripComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);
  private _sheetService = inject(SpreadsheetService);
  private _tripService = inject(TripService);
  private _shiftService = inject(ShiftService);
  private unsavedDataService = inject(UnsavedDataService);
  private _viewportScroller = inject(ViewportScroller);
  private _pollingService = inject(PollingService);
  private _uiPreferences = inject(UiPreferencesService);
  private logger = inject(LoggerService);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  protected authService = inject(AuthGoogleService);

  @ViewChild(TripFormComponent) public tripForm:TripFormComponent | undefined;
  @ViewChild(TripsTableGroupComponent) public tripsTable:TripsTableGroupComponent | undefined;

  public clearing = signal(false);
  public reloading = signal(false);
  public saving = signal(false);
  public syncInProgress = signal(false);
  public pollingEnabled = signal(false);
  public showYesterdayTrips = signal(false); // Controls the visibility of yesterday's trips section
  // Edit mode properties
  public isEditMode = signal(false);
  public editingTripId = signal<string | null>(null);
  public isLoading = signal(false); // General loading overlay state

  public savedTrips: ITrip[] = [];
  public todaysTrips = signal<ITrip[]>([]);
  public yesterdaysTrips = signal<ITrip[]>([]);
  public unsavedData = signal(false);
  public demoSheetAttached = signal(false);

  public defaultSheet = signal<ISpreadsheet | undefined>(undefined);
  public actionEnum = ActionEnum;
  protected readonly uiMessages = UI_MESSAGES;
  
  // Destroy subject for managing subscription cleanup
  private destroy$ = new Subject<void>();

  public trackByTrip(index: number, trip: ITrip): string | number {
    return trip?.rowId ?? trip?.key ?? index;
  }
  public ngOnDestroy(): void {
    // Complete the destroy subject to trigger takeUntil in all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  public async ngOnInit(): Promise<void> {
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

    // Start polling if enabled and not in edit mode.
    // Initial form/table hydration is stream-driven via trips$/shifts$ subscriptions above.
    if (!this.isEditMode() && this.pollingEnabled()) {
      await this.startPolling();
    }
    await this.refreshDefaultSheetState();
    
    // Load trip data for editing if in edit mode
    if (this.isEditMode() && this.editingTripId()) {
      await this.loadTripForEditing();
    }
  }

  public async load(showSpinner = true) {
    // Prevent reload if editing form
    if (this.editingTripId()) return;
    if (showSpinner) {
      this.isLoading.set(true);
    }
    try {
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

  // Toggle yesterday's trips visibility
  public toggleYesterdayTrips(): void {
    this.showYesterdayTrips.update(show => !show);
  }

  // Scroll to today's trips section or specific trip
  public scrollToTrip(tripId?: string): void {
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

  public async loadSheetDialog(inputValue: string) {
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
        await this.reload();
      }
    } finally {
      this.syncInProgress.set(false);
    }
  }

  public async saveSheetDialog(inputValue: string) {
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
      }
    } finally {
      this.syncInProgress.set(false);
      this.saving.set(false);
    }
  }
    
  public async confirmSaveTripsDialog() {
    const message = `This will save all changes to your spreadsheet. This process will take less than a minute.`;

    const dialogData: IConfirmDialog = {} as IConfirmDialog;
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

  public async confirmLoadTripsDialog() {
    // Stop polling while dialog is open
    this.stopPolling();
    const message = `This will load all changes from your spreadsheet. This process will take less than a minute.`;

    const dialogData: IConfirmDialog = {} as IConfirmDialog;
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

  public async reload(anchor?: string, isParentReload = false) {
    await this.refreshDefaultSheetState();
    const sheetId = this.defaultSheet()?.id;
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
  
  public async changePolling() {
    await this._uiPreferences.togglePolling();
  }

  public async startPolling() {
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
  public stopPolling() {
    this.logger.debug('Stopping polling');
    this._pollingService.stopPolling();
  }

  public async loadTripForEditing() {
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
  
  public async exitEditMode(scrollToTripId?: string) {
    this.editingTripId.set(null);
    this._router.navigate(['/trips']);
    if (this.tripForm) {
      await this.tripForm.formReset();
    }
    await this.load(); // This handles the overlay timing
    this.isEditMode.set(false);
    if (this.pollingEnabled()) {
      await this.startPolling();
    }
    if (scrollToTripId) {
      this.scrollToTrip(scrollToTripId);
    } else {
      this.scrollToTrip();
    }
  }

  public shouldShowUpdateMessage(): boolean {
    return this.showUpdateMessage();
  }

  // Cached computed used by templates to avoid repeated work
  public readonly showUpdateMessage = computed(() => this.todaysTrips().length === 0);

  private async refreshDefaultSheetState(): Promise<void> {
    this.defaultSheet.set((await this._sheetService.querySpreadsheets("default", "true"))[0]);
    this.demoSheetAttached.set(isDemoSheetName(this.defaultSheet()?.name));
  }
}
