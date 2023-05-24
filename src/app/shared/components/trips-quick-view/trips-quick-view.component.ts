import { Component, Input } from '@angular/core';
import { AddressHelper } from '@helpers/address.helper';
import { ITrip } from '@interfaces/trip.interface';

@Component({
  selector: 'trips-quick-view',
  templateUrl: './trips-quick-view.component.html',
  styleUrls: ['./trips-quick-view.component.scss']
})
export class TripsQuickViewComponent {
  @Input() trip: ITrip = {} as ITrip;

  public getPlaceAddress(place: string, address: string) {
    return AddressHelper.getPlaceAddress(place, address);
  }

  public getShortAddress(address: string) {
    return AddressHelper.getShortAddress(address);
  }
}
