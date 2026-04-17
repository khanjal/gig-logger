import { Component, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { CommonModule, NgIf, NgClass, CurrencyPipe } from '@angular/common';
import { ITrip } from '@interfaces/trip.interface';
import { TripService } from '@services/sheets/trip.service';
import { TripsModalComponent } from '@components/ui/trips-modal/trips-modal.component';
import { BaseFabButtonComponent } from '@components/base/base-fab-button/base-fab-button.component';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { NoSecondsPipe as NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { TruncatePipe as TruncatePipe } from '@pipes/truncate.pipe';
import { LoggerService } from '@services/logger.service';
import { DateHelper } from '@helpers/date.helper';

@Component({
  selector: 'app-shift-trips-table',
  templateUrl: './shift-trips-table.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    MatIcon,
    BaseFabButtonComponent,
    CurrencyPipe,
    NoSecondsPipe,
    TruncatePipe,
  ],
  styleUrls: ['./shift-trips-table.component.scss'],
})

export class ShiftTripsTableComponent implements OnInit, OnChanges {
  @Input() tripKey: string = '';
  prefers24Hour: boolean = false;
  displayedColumns: string[] = [];
  trips = signal<ITrip[]>([]);
  private loadToken = 0;

  constructor(
    private tripService: TripService,
    private dialog: MatDialog,
    private _logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.prefers24Hour = DateHelper.prefers24Hour();
    this.displayedColumns = ['place', 'total', 'name', 'pickup', 'dropoff', 'address'];
    void this.loadTripsForKey(this.tripKey);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tripKey']) {
      void this.loadTripsForKey(this.tripKey);
    }
  }

  private async loadTripsForKey(shiftKey: string): Promise<void> {
    try {
      if (!shiftKey) {
        this.trips.set([]);
        return;
      }

      const requestToken = ++this.loadToken;

      // Split the key on dashes
      const keyParts = shiftKey.split('-');
      const excludedKey = keyParts.length >= 3 ? `${keyParts[0]}-X-${keyParts[2]}` : '';

      const trips = await this.tripService.query('key', shiftKey);
      const excludedTrips = excludedKey
        ? (await this.tripService.query('key', excludedKey)).filter(trip => trip.number.toString() === keyParts[1])
        : [];

      if (requestToken !== this.loadToken || this.tripKey !== shiftKey) {
        return;
      }
      
      this.trips.set([...trips, ...excludedTrips]);
    } catch (error) {
      this._logger.error('Error fetching trips', { error, shiftKey });
    }
  }

  async viewTrips(trips: ITrip[]) {
    this.dialog.open(TripsModalComponent, {
      data: { title: 'Shift trips', trips },
      height: '550px',
      width: '600px',
      panelClass: 'custom-modalbox'
    });
  }
}
