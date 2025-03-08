import { Component, Input } from '@angular/core';
import { ITrip } from '@interfaces/trip.interface';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { NgClass, NgIf, DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { NoSecondsPipe } from '../../pipes/no-seconds.pipe';
import { ShortAddressPipe } from '../../pipes/short-address.pipe';
import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
    selector: 'trips-quick-view',
    templateUrl: './trips-quick-view.component.html',
    styleUrls: ['./trips-quick-view.component.scss'],
    standalone: true,
    imports: [MatCard, MatCardHeader, MatIcon, NgClass, MatCardContent, NgIf, DecimalPipe, CurrencyPipe, DatePipe, NoSecondsPipe, ShortAddressPipe, TruncatePipe]
})
export class TripsQuickViewComponent {
  @Input() trip: ITrip = {} as ITrip;
}
