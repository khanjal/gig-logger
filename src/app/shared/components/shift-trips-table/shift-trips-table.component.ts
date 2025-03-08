import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITrip } from '@interfaces/trip.interface';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { NgClass, CurrencyPipe } from '@angular/common';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { NoSecondsPipe } from "@pipes/no-seconds.pipe";
import { TripService } from '@services/trip.service';

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

  constructor(private tripService: TripService) {}

  async ngOnInit() { 
    this.displayedColumns = ['place', 'total', 'name', 'pickup', 'dropoff', 'address'];
    await this.getTripsByShiftKey(this.tripKey);
  }

  async getTripsByShiftKey(shiftKey: string) {
    try {
      this.trips = await this.tripService.queryTrips('key', shiftKey);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  }
}
