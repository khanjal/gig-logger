import { Component, OnInit } from '@angular/core';
import { ActionEnum } from '@enums/action.enum';
import { IShift } from '@interfaces/shift.interface';
import { ShiftService } from '@services/shift.service';

@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.scss']
})
export class ShiftsComponent implements OnInit {
  shifts: IShift[] = [];
  actionEnum = ActionEnum;

  constructor(private _shiftService: ShiftService) { }

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload() {
    this.shifts = (await this._shiftService.getPreviousWeekShifts()).reverse();
  }

  handleParentReload() {
    this.shifts = []; // Clear the shifts array so that it'll refresh everything
    this.reload();
  }
}