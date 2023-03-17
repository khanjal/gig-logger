import { Component, Input, OnInit } from '@angular/core';
import { TripModel } from 'src/app/models/trip.model';

@Component({
  selector: 'trips-table-simple',
  templateUrl: './trips-table-simple.component.html',
  styleUrls: ['./trips-table-simple.component.scss']
})
export class TripsTableSimpleComponent implements OnInit {
  @Input() title: string = "";
  @Input() trips: TripModel[] = [];
  


  displayedColumns: string[] = [];

  ngOnInit() { 
    this.displayedColumns = ['saved', 'date', 'service', 'place', 'time', 'amount', 'name', 'address'];
  }
}
