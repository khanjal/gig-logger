import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ShiftModel } from 'src/app/shared/models/shift.model';
import { TripModel } from 'src/app/shared/models/trip.model';
import { AddressHelper } from 'src/app/shared/helpers/address.helper';
import { GoogleDriveService } from 'src/app/shared/services/googleSheet.service';
import { ShiftHelper } from 'src/app/shared/helpers/shift.helper';
import { TripHelper } from 'src/app/shared/helpers/trip.helper';

@Component({
  selector: 'app-quick',
  templateUrl: './quick.component.html',
  styleUrls: ['./quick.component.scss']
})
export class QuickComponent implements OnInit {

  clearing: boolean = false;
  reloading: boolean = false;
  saving: boolean = false;

  shifts: ShiftModel[] = [];
  savedTrips: TripModel[] = [];
  sheetTrips: TripModel[] = [];
  unsavedTrips: TripModel[] = [];

  constructor(
      private _router: Router, 
      private _googleService: GoogleDriveService
    ) { }

  async ngOnInit(): Promise<void> {
    await this.load();

    
  }

  async save() {
    console.log('Saving...');
    this.saving = true;
    await this._googleService.saveLocalData();
    await this.reload();
    this.saving = false;
    console.log('Saved!');
  }

  async load() {
    this.shifts = ShiftHelper.getPastShifts(1);
    this.sheetTrips = TripHelper.getPastTrips(1);
    this.unsavedTrips = TripHelper.getUnsavedLocalTrips();
    this.savedTrips = TripHelper.getSavedLocalTrips();
  }

  async clear() {
    
  }

  async reload() {
    this.reloading = true;
    await this._googleService.loadRemoteData();

    await this.load();
    this.reloading = false;
    // window.location.reload();
  }

  public getShortAddress(address: string): string {
    return AddressHelper.getShortAddress(address);
  }

  

}
