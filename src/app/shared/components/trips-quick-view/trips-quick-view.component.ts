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
}
