import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITrip } from '@interfaces/trip.interface';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { NgClass, CurrencyPipe } from '@angular/common';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { NoSecondsPipe } from "@pipes/no-seconds.pipe";
import { TripService } from '@services/sheets/trip.service';
import { ShiftTripsQuickViewComponent } from '@components/shift-trips-quick-view/shift-trips-quick-view.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-shift-trips-table',
  templateUrl: './shift-trips-table.component.html',
  styleUrl: './shift-trips-table.component.scss',
  // imports: [CommonModule, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, NgClass, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, CurrencyPipe, TruncatePipe, NoSecondsPipe]
})

export class ShiftTripsTableComponent {
  @Input() tripKey: string = '';
  
  displayedColumns: string[] = [];
  trips: ITrip[] = [];

  constructor(
    private tripService: TripService,
    private dialog: MatDialog,
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
      console.error('Error fetching trips:', error);
    }
  }

  async viewTrips(trips: ITrip[]) {
    let dialogRef = this.dialog.open(ShiftTripsQuickViewComponent, {
      data: trips,
      height: '400px',
      width: '500px',
      panelClass: 'custom-modalbox'
    });
  }
}
