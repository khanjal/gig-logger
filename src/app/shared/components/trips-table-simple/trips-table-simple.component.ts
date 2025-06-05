import { Component, Input, OnInit } from '@angular/core';
import { ITrip } from '@interfaces/trip.interface';
import { NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';

@Component({
    selector: 'trips-table-simple',
    templateUrl: './trips-table-simple.component.html',
    styleUrls: ['./trips-table-simple.component.scss'],
    standalone: true,
    imports: [NgIf, MatIcon, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, CurrencyPipe, DatePipe, NoSecondsPipe, ShortAddressPipe, TruncatePipe]
})
export class TripsTableSimpleComponent implements OnInit {
  @Input() title: string = "";
  @Input() link: string = "";
  @Input() trips: ITrip[] = [];
  
  /**
   * Future enhancement: Add row grouping functionality
   * Reference implementation: https://stackblitz.com/edit/angular-material-table-row-grouping
   * This would allow grouping trips by date, service, or other criteria
   */
  displayedColumns: string[] = [];

  ngOnInit() { 
    this.displayedColumns = ['date', 'service', 'place', 'total', 'name', 'pickup', 'dropoff', 'address'];
  }
}
