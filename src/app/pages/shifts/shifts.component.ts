import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.scss']
})
export class ShiftsComponent implements OnInit {

  shiftControl = new FormControl('');
  timeControl = new FormControl('');
  serviceControl = new FormControl('');
  placeControl = new FormControl('');
  amountControl = new FormControl('');

  constructor() { }

  ngOnInit(): void {
  }

}
