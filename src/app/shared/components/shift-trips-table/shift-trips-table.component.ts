import { Component, Input } from '@angular/core';
import { CommonModule, NgIf, NgStyle } from '@angular/common';
import { ITrip } from '@interfaces/trip.interface';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { NgClass, CurrencyPipe } from '@angular/common';
import { TripService } from '@services/sheets/trip.service';
import { ShiftTripsQuickViewComponent } from '@components/shift-trips-quick-view/shift-trips-quick-view.component';
import { MatDialog } from '@angular/material/dialog';
import { MatCard } from '@angular/material/card';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NoSecondsPipe as NoSecondsPipe_1 } from '@pipes/no-seconds.pipe';
import { TruncatePipe as TruncatePipe_1 } from '@pipes/truncate.pipe';
import { LoggerService } from '@services/logger.service';

@Component({
    selector: 'app-shift-trips-table',
    templateUrl: './shift-trips-table.component.html',
    styleUrl: './shift-trips-table.component.scss',
    standalone: true,
    imports: [
        NgIf,
        MatCard,
        MatMiniFabButton,
        MatIcon,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        NgClass,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        NgStyle,
        CurrencyPipe,
        NoSecondsPipe_1,
        TruncatePipe_1,
    ],
})

export class ShiftTripsTableComponent {
  @Input() tripKey: string = '';
  
  displayedColumns: string[] = [];
  trips: ITrip[] = [];

  constructor(
    private tripService: TripService,
    private dialog: MatDialog,
    private _logger: LoggerService
  ) {}

  async ngOnInit() { 
    this.displayedColumns = ['place', 'total', 'name', 'pickup', 'dropoff', 'address'];
    await this.getTripsByShiftKey(this.tripKey);
  }

  async getTripsByShiftKey(shiftKey: string) {
    try {
      // Split the key on dashes
      const keyParts = shiftKey.split('-');
      let excludedKey = `${keyParts[0]}-X-${keyParts[2]}`;

      let trips = await this.tripService.query('key', this.tripKey);
      let excludedTrips = (await this.tripService.query('key', excludedKey)).filter(trip => trip.number.toString() === keyParts[1]); 
      
      this.trips = [...trips, ...excludedTrips];
    } catch (error) {
      this._logger.error('Error fetching trips', { error, shiftKey });
    }
  }

  async viewTrips(trips: ITrip[]) {
    this.dialog.open(ShiftTripsQuickViewComponent, {
      data: trips,
      height: '500px',
      width: '500px',
      panelClass: 'custom-modalbox'
    });
  }
}
