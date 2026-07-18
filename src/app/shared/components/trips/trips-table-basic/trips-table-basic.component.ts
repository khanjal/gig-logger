import { Component, Input, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { DateHelper } from '@helpers/date.helper';
import type { ITrip } from '@interfaces/entities/trip.interface';


@Component({
    selector: 'app-trips-table-basic',
    templateUrl: './trips-table-basic.component.html',
    styleUrls: ['./trips-table-basic.component.scss'],
    standalone: true,
  imports: [MatIcon, NgClass, CurrencyPipe, DatePipe]
})
export class TripsTableBasicComponent implements OnInit {
  @Input() trips: ITrip[] = [];
  
  displayedColumns: string[] = [];

  prefers24Hour = false;
  ngOnInit() { 
    this.displayedColumns = ['date', 'service', 'place', 'tips'];
    this.prefers24Hour = DateHelper.prefers24Hour();
  }

  trackByTrip(index: number, trip: ITrip): number {
    return trip?.id ?? index;
  }

  hasSecondaryData = (trip: ITrip): boolean => {
    return !!(trip.endUnit || trip.note);
  };
}
