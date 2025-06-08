import { Component, Input, OnInit } from '@angular/core';
import { ITrip } from '@interfaces/trip.interface';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { NgClass, NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { TruncatePipe } from '@pipes/truncate.pipe';

@Component({
    selector: 'app-trips-table-basic',
    templateUrl: './trips-table-basic.component.html',
    styleUrls: ['./trips-table-basic.component.scss'],
    standalone: true,
    imports: [MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, NgClass, NgIf, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, CurrencyPipe, DatePipe, TruncatePipe]
})
export class TripsTableBasicComponent implements OnInit {
  @Input() trips: ITrip[] = [];
  
  displayedColumns: string[] = [];

  ngOnInit() { 
    this.displayedColumns = ['date', 'service', 'place', 'tips'];
  }

  hasSecondaryData = (index: number, trip: ITrip): boolean => {
    return !!(trip.endUnit || trip.note);
  };
}
