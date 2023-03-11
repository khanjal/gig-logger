import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GoogleDriveService } from 'src/app/shared/services/googleSheet.service';

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

  constructor(private _googleSheetService: GoogleDriveService) { }

  async ngOnInit(): Promise<void> {
      let testData = await this._googleSheetService.loadAddresses();

      console.log('Test');
      //console.log(testData);
  }

}
