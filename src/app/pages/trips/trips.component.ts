import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ViewportScroller, NgIf, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DateHelper } from '@helpers/date.helper';

import { ActionEnum } from '@enums/action.enum';

import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { ITrip } from '@interfaces/trip.interface';

import { GigWorkflowService } from '@services/gig-workflow.service';
import { PollingService } from '@services/polling.service';
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

import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';
import { TruncatePipe } from "@pipes/truncate.pipe";
import { BackToTopComponent } from '@components/ui/back-to-top/back-to-top.component';

@Component({
    selector: 'app-trip',
    templateUrl: './trips.component.html',
    styleUrls: ['./trips.component.scss'],
    standalone: true,
    imports: [CommonModule, CurrentAverageComponent, TripFormComponent, MatFabButton, MatIcon, MatSlideToggle, TripsQuickViewComponent, NgIf, TripsTableGroupComponent, TruncatePipe, BackToTopComponent]
})
export class TripComponent implements OnInit, OnDestroy {
  @ViewChild(TripFormComponent) tripForm:TripFormComponent | undefined;
  @ViewChild(CurrentAverageComponent) average:CurrentAverageComponent | undefined;
  @ViewChild(TripsTableGroupComponent) tripsTable:TripsTableGroupComponent | undefined;

  demoSheetId = environment.demoSheet;

  clearing: boolean = false;
  reloading: boolean = false;
  saving: boolean = false;
  pollingEnabled: boolean = false;
  showYesterdayTrips: boolean = false; // Controls the visibility of yesterday's trips section
  // Edit mode properties
  isEditMode: boolean = false;
  editingTripId: string | null = null;
  isLoading: boolean = false; // General loading overlay state

  savedTrips: ITrip[] = [];
  todaysTrips: ITrip[] = [];
  yesterdaysTrips: ITrip[] = [];
  unsavedData: boolean = false;

  defaultSheet: ISpreadsheet | undefined;
  actionEnum = ActionEnum;
  
  // Destroy subject for managing subscription cleanup
  private destroy$ = new Subject<void>();

  constructor(
      public dialog: MatDialog,
      private _snackBar: MatSnackBar,
      private _gigLoggerService: GigWorkflowService,
      private _sheetService: SpreadsheetService,
      private _shiftService: ShiftService,
      private _tripService: TripService,
      private unsavedDataService: UnsavedDataService,
      private _viewportScroller: ViewportScroller,
      private _pollingService: PollingService,
      private logger: LoggerService,
      private _route: ActivatedRoute,
      private _router: Router
    ) { }
  ngOnDestroy(): void {
    // Complete the destroy subject to trigger takeUntil in all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnInit(): Promise<void> {
    // Check if we're in edit mode based on route with automatic cleanup
    this._route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const tripId = params.get('id');
        if (tripId) {
          this.isEditMode = true;
          this.editingTripId = tripId;
        } else {
          this.isEditMode = false;
          this.editingTripId = null;
        }
      });

    // Load polling preference from localStorage
    const savedPollingState = localStorage.getItem('pollingEnabled');
    this.pollingEnabled = savedPollingState ? JSON.parse(savedPollingState) : false;

    // Keep local toggle in sync with global polling state (e.g., sync menu)
    this._pollingService.pollingEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        this.pollingEnabled = enabled;
        localStorage.setItem('pollingEnabled', JSON.stringify(enabled));
      });

    // Only load if not in edit mode
    if (!this.isEditMode) {
      await this.load();
      // Start polling if enabled and not in edit mode
      if (this.pollingEnabled) {
        await this.startPolling();
      }
    }
    this.defaultSheet = (await this._sheetService.querySpreadsheets("default", "true"))[0];
    
    // Load trip data for editing if in edit mode
    if (this.isEditMode && this.editingTripId) {
      await this.loadTripForEditing();
    }
    
    // Subscribe to parent reload with automatic cleanup
    this._pollingService.parentReload
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        await this.reload(undefined, true); // Pass true to indicate this is a parent reload
      });
  }

  public async load(showSpinner: boolean = true) {
    // Prevent reload if editing form
    if (this.editingTripId) return;
    if (showSpinner) {
      this.isLoading = true;
    }
    this.unsavedData = await this.unsavedDataService.hasUnsavedData();
    this.todaysTrips = (await this._tripService.getByDate(DateHelper.toISO(DateHelper.getDateFromDays()))).reverse();
    this.yesterdaysTrips = (await this._tripService.getByDate(DateHelper.toISO(DateHelper.getDateFromDays(1))));
    await this.average?.load();
    await this.tripsTable?.load();
    this.tripForm?.load();
    if (showSpinner) {
      setTimeout(() => {
        this.isLoading = false;
      }, 400);
    }
  }



  // Toggle yesterday's trips visibility
  toggleYesterdayTrips(): void {
    this.showYesterdayTrips = !this.showYesterdayTrips;
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
    let dialogRef = this.dialog.open(DataSyncModalComponent, {
        height: '400px',
        width: '500px',
        panelClass: 'custom-modalbox',
        data: inputValue
    });

    dialogRef.afterClosed().subscribe(async result => {
        if (result) {
            await this.reload("todaysTrips");
        }
    });
  }

  async saveSheetDialog(inputValue: string) {
    this.saving = true;
    const dialogRef = this.dialog.open(DataSyncModalComponent, {
        height: '400px',
        width: '500px',
        panelClass: 'custom-modalbox',
        data: inputValue
    });

    dialogRef.afterClosed().subscribe(async result => {
      try {
        if (result) {
          this._snackBar.open("Trip(s) Saved to Spreadsheet");
          await this.reload("todaysTrips");
          this._viewportScroller.scrollToAnchor("todaysTrips");
        }
      } finally {
        this.saving = false;
      }
    });
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

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        this.saving = true;
        await this.saveSheetDialog('save');
      }
    });
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
      if (this.pollingEnabled && !this.isEditMode) {
        await this.startPolling();
      }
    });
  }

  async reload(anchor?: string, isParentReload: boolean = false) {
    let sheetId = this.defaultSheet?.id;
    if (!sheetId) {
      return;
    }

    this.reloading = true;

    await this.load(!isParentReload); // Don't show spinner if it's a parent reload

    this.reloading = false;

    if (anchor) {
      this._viewportScroller.scrollToAnchor(anchor);
    }
  }
  
  async changePolling() {
    this.pollingEnabled = !this.pollingEnabled;

    // Save polling preference to localStorage
    localStorage.setItem('pollingEnabled', JSON.stringify(this.pollingEnabled));

    // Start or stop polling based on new state
    if (this.pollingEnabled && !this.isEditMode) {
      await this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  async startPolling() {
    // Only poll if pollingEnabled and not in edit mode
    if (!this.pollingEnabled || this.isEditMode) {
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
    if (!this.editingTripId) return;
    
    this.isLoading = true;
    
    try {
      const tripId = parseInt(this.editingTripId);
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
      this.isLoading = false;
    }, 200);
  }
  
  async exitEditMode(scrollToTripId?: string) {
    this.isEditMode = false;
    this.editingTripId = null;
    this._router.navigate(['/trips']);
    if (this.tripForm) {
      await this.tripForm.formReset();
    }
    await this.load(); // This handles the overlay timing
    if (this.pollingEnabled) {
      await this.startPolling();
    }
    if (scrollToTripId) {
      this.scrollToTrip(scrollToTripId);
    } else {
      this.scrollToTrip();
    }
  }

  shouldShowUpdateMessage(): boolean {
    return !(this.todaysTrips && this.todaysTrips.length > 0);
  }
}
