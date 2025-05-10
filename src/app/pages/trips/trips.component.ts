import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ViewportScroller, NgClass, NgIf, CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DateHelper } from '@helpers/date.helper';

import { ActionEnum } from '@enums/action.enum';

import { IConfirmDialog } from '@interfaces/confirm-dialog.interface';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { ITrip } from '@interfaces/trip.interface';

import { GigLoggerService } from '@services/gig-logger.service';
import { PollingService } from '@services/polling.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

import { CurrentAverageComponent } from '@components/current-average/current-average.component';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { TripFormComponent } from '@components/trip-form/trip-form.component';
import { TripsTableGroupComponent } from '@components/trips-table-group/trips-table-group.component';
import { DataSyncModalComponent } from '@components/data-sync-modal/data-sync-modal.component';

import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TripsQuickViewComponent } from '../../shared/components/trips-quick-view/trips-quick-view.component';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';

@Component({
    selector: 'app-trip',
    templateUrl: './trips.component.html',
    styleUrls: ['./trips.component.scss'],
    standalone: true,
    imports: [CommonModule, CurrentAverageComponent, TripFormComponent, MatFabButton, MatIcon, MatSlideToggle, NgClass, TripsQuickViewComponent, NgIf, MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, TripsTableGroupComponent]
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
  showBackToTop: boolean = false; // Controls the visibility of the "Back to Top" button

  savedTrips: ITrip[] = [];
  todaysTrips: ITrip[] = [];
  yesrterdaysTrips: ITrip[] = [];
  unsavedData: boolean = false;

  defaultSheet: ISpreadsheet | undefined;
  actionEnum = ActionEnum;
  parentReloadSubscription!: Subscription;

  constructor(
      public dialog: MatDialog,
      private _snackBar: MatSnackBar,
      private _gigLoggerService: GigLoggerService,
      private _sheetService: SpreadsheetService,
      private _shiftService: ShiftService,
      private _tripService: TripService,
      private _viewportScroller: ViewportScroller,
      private _pollingService: PollingService,
      private viewportScroller: ViewportScroller
    ) { }

  ngOnDestroy(): void {
    this._pollingService.stopPolling();
  }

  async ngOnInit(): Promise<void> {
    await this.load();
    this.defaultSheet = (await this._sheetService.querySpreadsheets("default", "true"))[0];
    this.parentReloadSubscription = this._pollingService.parentReload.subscribe(async () => {
      await this.reload();
    });
  }

  public async load() {
    this.unsavedData = (await this._tripService.getUnsaved()).length > 0 || (await this._shiftService.getUnsavedShifts()).length > 0;
    this.todaysTrips = (await this._tripService.getByDate(DateHelper.getISOFormat(DateHelper.getDateFromDays()))).reverse();
    this.yesrterdaysTrips = (await this._tripService.getByDate(DateHelper.getISOFormat(DateHelper.getDateFromDays(1)))).reverse();

    await this.average?.load();
    await this.tripsTable?.load();
    this.tripForm?.load();
  }

  // Listen for scroll events
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const formElement = document.getElementById('tripForm');
    const formHeight = formElement ? formElement.offsetHeight / 2 : 0;

    // Show the button if scrolled past the form
    this.showBackToTop = scrollPosition > formHeight;
  }

  // Scroll to the top of the page
  scrollToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
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
      let dialogRef = this.dialog.open(DataSyncModalComponent, {
          height: '400px',
          width: '500px',
          panelClass: 'custom-modalbox',
          data: inputValue
      });

      dialogRef.afterClosed().subscribe(async result => {

          if (result) {
              await this._tripService.saveUnsaved();
              await this._shiftService.saveUnsavedShifts();
              this._snackBar.open("Trip(s) Saved to Spreadsheet");

              await this.reload("todaysTrips");
              this._viewportScroller.scrollToAnchor("todaysTrips");
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
      if(result) {
        await this.saveSheetDialog('save');
      }
    });
  }

  async confirmLoadTripsDialog() {
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

      if (this.pollingEnabled) {
        await this.startPolling();
      }
    });
  }

  async reload(anchor?: string) {
    let sheetId = this.defaultSheet?.id;
    if (!sheetId) {
      return;
    }

    this.reloading = true;

    await this.load();
    await this._gigLoggerService.calculateShiftTotals();

    this.reloading = false;

    if (anchor) {
      this._viewportScroller.scrollToAnchor(anchor);
    }
  }

  async changePolling() {
    this.pollingEnabled = !this.pollingEnabled;

    if (this.pollingEnabled) {
      await this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  async startPolling() {
    if (!this.pollingEnabled) {
      return;
    }
    
    console.log('Starting polling');
    this._pollingService.stopPolling();
    await this._pollingService.startPolling();
  }

  stopPolling() {
    console.log('Stopping polling');
    this._pollingService.stopPolling();
  }
}
