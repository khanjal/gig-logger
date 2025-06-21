import { Component, Input, OnInit } from '@angular/core';
import { ITrip } from '@interfaces/trip.interface';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { NgClass, NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { DateHelper } from '@helpers/date.helper';

@Component({
    selector: 'app-trips-table-basic',
    templateUrl: './trips-table-basic.component.html',
    styleUrls: ['./trips-table-basic.component.scss'],
    standalone: true,
    imports: [MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatIcon, NgClass, NgIf, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, CurrencyPipe, DatePipe, TruncatePipe, NoSecondsPipe]
})
export class TripsTableBasicComponent implements OnInit {
  @Input() trips: ITrip[] = [];
  
  displayedColumns: string[] = [];

  prefers24Hour: boolean = false;

  ngOnInit() { 
    this.displayedColumns = ['date', 'service', 'place', 'tips'];
    this.prefers24Hour = DateHelper.prefers24Hour();
  }

  hasSecondaryData = (index: number, trip: ITrip): boolean => {
    return !!(trip.endUnit || trip.note);
  };
}
