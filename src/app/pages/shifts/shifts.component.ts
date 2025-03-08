import { Component, OnInit } from '@angular/core';
import { ActionEnum } from '@enums/action.enum';
import { IShift } from '@interfaces/shift.interface';
import { ShiftService } from "@services/shift.service";
import { NgClass, DatePipe } from '@angular/common';
import { ShiftsQuickViewComponent } from '@components/shifts-quick-view/shifts-quick-view.component';

@Component({
    selector: 'app-shifts',
    templateUrl: './shifts.component.html',
    styleUrls: ['./shifts.component.scss'],
    standalone: true,
    imports: [NgClass, ShiftsQuickViewComponent]
})
export class ShiftsComponent implements OnInit {
  shifts: IShift[] = [];
  actionEnum = ActionEnum;

  constructor(private _shiftService: ShiftService) { }

  async ngOnInit(): Promise<void> {
    this.shifts = (await this._shiftService.getPreviousWeekShifts()).reverse();
  }

}
