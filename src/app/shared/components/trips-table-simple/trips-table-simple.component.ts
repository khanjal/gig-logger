import { Component, Input, OnInit } from '@angular/core';
import { ITrip } from '@interfaces/trip.interface';

@Component({
  selector: 'trips-table-simple',
  templateUrl: './trips-table-simple.component.html',
  styleUrls: ['./trips-table-simple.component.scss']
})
export class TripsTableSimpleComponent implements OnInit {
  @Input() title: string = "";
  @Input() link: string = "";
  @Input() trips: ITrip[] = [];
  
  // TODO: Add grouping: https://stackblitz.com/edit/angular-material-table-row-grouping?file=src%2Fapp%2Fapp.module.ts
  displayedColumns: string[] = [];

  ngOnInit() { 
    this.displayedColumns = ['date', 'service', 'place', 'pickup', 'dropoff', 'total', 'name', 'address'];
  }
}
