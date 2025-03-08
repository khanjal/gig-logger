import { Component, Input, OnInit } from '@angular/core';
import { ITrip } from '@interfaces/trip.interface';

@Component({
  selector: 'app-trips-table-basic',
  templateUrl: './trips-table-basic.component.html',
  styleUrls: ['./trips-table-basic.component.scss']
})
export class TripsTableBasicComponent implements OnInit {
  @Input() trips: ITrip[] = [];
  
  displayedColumns: string[] = [];

  ngOnInit() { 
    this.displayedColumns = ['date', 'service', 'place', 'tips'];
  }
}
