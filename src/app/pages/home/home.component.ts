import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [MatIcon]
})
export class HomeComponent implements OnInit {
  public demoSheetId = environment.demoSheet;
  
  constructor() { }

  ngOnInit(): void {
  }

}
