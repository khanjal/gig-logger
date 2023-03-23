import { Component, Input } from '@angular/core';
import { TripModel } from '../../models/trip.model';

@Component({
  selector: 'trips-quick-view',
  templateUrl: './trips-quick-view.component.html',
  styleUrls: ['./trips-quick-view.component.scss']
})
export class TripsQuickViewComponent {
  @Input() trip: TripModel = new TripModel;
}
