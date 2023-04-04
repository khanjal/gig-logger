import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ShiftModel } from 'src/app/shared/models/shift.model';
import { TripModel } from 'src/app/shared/models/trip.model';
import { AddressHelper } from 'src/app/shared/helpers/address.helper';
import { GoogleDriveService } from 'src/app/shared/services/googleSheet.service';
import { ShiftHelper } from 'src/app/shared/helpers/shift.helper';
import { TripHelper } from 'src/app/shared/helpers/trip.helper';
import { QuickFormComponent } from './quick-form/quick-form.component';
import { SiteModel } from 'src/app/shared/models/site.model';

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
      private _googleService: GoogleDriveService
    ) { }

  async ngOnInit(): Promise<void> {
    this.load();
  }

  async save() {
    console.log('Saving...');
    this.saving = true;
    await this._googleService.saveLocalData();
    await this.reload();
    this.saving = false;
    console.log('Saved!');
  }

  public load() {
    this.sheetTrips = TripHelper.getRemoteTrips().reverse();
    this.unsavedTrips = TripHelper.getUnsavedLocalTrips();
    this.savedTrips = TripHelper.getSavedLocalTrips().reverse();

    // console.log(this.form);
    this.form?.load();
  }

  async saveLocalTrip(trip: TripModel) {
    this.saving = true;
    await this._googleService.saveLocalData();
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
    await this._googleService.loadRemoteData();

    this.load();
    this.reloading = false;
    // window.location.reload();
  }

  public getShortAddress(address: string): string {
    return AddressHelper.getShortAddress(address);
  }

  

}
