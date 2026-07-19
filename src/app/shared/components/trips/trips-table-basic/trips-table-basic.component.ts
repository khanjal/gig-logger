import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
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
  @Input() public trips: ITrip[] = [];
  
  public displayedColumns: string[] = [];

  public prefers24Hour = false;
  public ngOnInit() { 
    this.displayedColumns = ['date', 'service', 'place', 'tips'];
    this.prefers24Hour = DateHelper.prefers24Hour();
  }

  public trackByTrip(index: number, trip: ITrip): number {
    return trip?.id ?? index;
  }

  public hasSecondaryData = (trip: ITrip): boolean => {
    return !!(trip.endUnit || trip.note);
  };
}
