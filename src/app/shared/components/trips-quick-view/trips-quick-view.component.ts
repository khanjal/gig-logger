import { Component, Input } from '@angular/core';
import { TripModel } from '../../models/trip.model';
import { AddressHelper } from '@helpers/address.helper';

@Component({
  selector: 'trips-quick-view',
  templateUrl: './trips-quick-view.component.html',
  styleUrls: ['./trips-quick-view.component.scss']
})
export class TripsQuickViewComponent {
  @Input() trip: TripModel = new TripModel;

  public getPlaceAddress(place: string, address: string) {
    return AddressHelper.getPlaceAddress(place, address);
  }

  public getShortAddress(address: string) {
    return AddressHelper.getShortAddress(address);
  }
}
