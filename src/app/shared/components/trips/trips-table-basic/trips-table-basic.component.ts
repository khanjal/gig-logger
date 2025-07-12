import { Component, Input, OnInit } from '@angular/core';
import { ITrip } from '@interfaces/trip.interface';
import { MatIcon } from '@angular/material/icon';
import { NgClass, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { DateHelper } from '@helpers/date.helper';

@Component({
    selector: 'app-trips-table-basic',
    templateUrl: './trips-table-basic.component.html',
    styleUrls: ['./trips-table-basic.component.scss'],
    standalone: true,
    imports: [MatIcon, NgClass, NgIf, CurrencyPipe, DatePipe, TruncatePipe]
})
export class TripsTableBasicComponent implements OnInit {
  @Input() trips: ITrip[] = [];
  
  displayedColumns: string[] = [];

  prefers24Hour: boolean = false;

  ngOnInit() { 
    this.displayedColumns = ['date', 'service', 'place', 'tips'];
    this.prefers24Hour = DateHelper.prefers24Hour();
  }

  hasSecondaryData = (trip: ITrip): boolean => {
    return !!(trip.endUnit || trip.note);
  };
}
