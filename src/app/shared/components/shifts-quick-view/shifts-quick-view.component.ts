import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { IShift } from '@interfaces/shift.interface';
import { ShiftService } from "@services/shift.service";
import { NoSecondsPipe } from "@pipes/no-seconds.pipe";

@Component({
  selector: 'app-shifts-quick-view',
  standalone: true,
  templateUrl: './shifts-quick-view.component.html',
  styleUrl: './shifts-quick-view.component.scss',
  imports: [CommonModule, MatCardModule, MatIconModule, NoSecondsPipe]
})
export class ShiftsQuickViewComponent {
  shift: IShift = {} as IShift();
}
