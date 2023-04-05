import { Component, Input, OnInit } from '@angular/core';
import { TripModel } from 'src/app/shared/models/trip.model';

@Component({
  selector: 'trips-table-simple',
  templateUrl: './trips-table-simple.component.html',
  styleUrls: ['./trips-table-simple.component.scss']
})
export class TripsTableSimpleComponent implements OnInit {
  @Input() title: string = "";
  @Input() trips: TripModel[] = [];
  
  // TODO: Add grouping: https://stackblitz.com/edit/angular-material-table-row-grouping?file=src%2Fapp%2Fapp.module.ts
  displayedColumns: string[] = [];

  ngOnInit() { 
    this.displayedColumns = ['date', 'service', 'place', 'time', 'total', 'name', 'address'];
  }
}
