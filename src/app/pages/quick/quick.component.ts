import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TripModel } from 'src/app/shared/models/trip.model';
import { AddressHelper } from 'src/app/shared/helpers/address.helper';
import { GoogleSheetService } from 'src/app/shared/services/googleSheet.service';
import { ShiftHelper } from 'src/app/shared/helpers/shift.helper';
import { TripHelper } from 'src/app/shared/helpers/trip.helper';
import { QuickFormComponent } from './quick-form/quick-form.component';
import { SiteModel } from 'src/app/shared/models/site.model';
import { TripService } from '@services/trip.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

@Component({
  selector: 'app-quick',
  templateUrl: './quick.component.html',
  styleUrls: ['./quick.component.scss']
})
export class QuickComponent implements OnInit {
  @ViewChild(QuickFormComponent) form:QuickFormComponent | undefined;

  siteData: SiteModel = new SiteModel;

  clearing: boolean = false;
  reloading: boolean = false;
  saving: boolean = false;

  savedTrips: TripModel[] = [];
  sheetTrips: TripModel[] = [];
  unsavedTrips: TripModel[] = [];

  constructor(
      private _router: Router, 
      private _googleService: GoogleSheetService,
      private _spreadsheetService: SpreadsheetService,
      private _tripService: TripService
    ) { }

  async ngOnInit(): Promise<void> {
    this.load();
  }

  async save() {
    console.log('Saving...');
    this.saving = true;
    await this._googleService.commitUnsavedShifts();
    await this._googleService.commitUnsavedTrips();
    await this.reload();
    this.saving = false;
    console.log('Saved!');
  }

  public async load() {
    ShiftHelper.updateAllShiftTotals();
    this.sheetTrips = (await this._tripService.getRemoteTrips()).reverse().slice(0,50);
    this.unsavedTrips = await this._tripService.queryLocalTrips("saved", "false");
    //this.savedTrips = TripHelper.getSavedLocalTrips().reverse();

    // console.log(this.form);
    this.form?.load();
  }

  async saveLocalTrip(trip: TripModel) {
    this.saving = true;
    await this._googleService.commitUnsavedTrips();
    await this.reload();
    this.saving = false;
  }

  async deleteUnsavedLocalTrip(trip: TripModel) {
    TripHelper.deleteTrip(trip);

    this.load();
  }

  async clearSavedLocalData() {
    ShiftHelper.clearSavedShifts();
    TripHelper.clearSavedTrips();

    this.load();
  }

  async reload() {
    this.reloading = true;
    const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0]?.id;
    await this._googleService.loadRemoteData(spreadsheetId);

    this.load();
    this.reloading = false;
    // window.location.reload();
  }

  public getShortAddress(address: string): string {
    return AddressHelper.getShortAddress(address);
  }

  

}
