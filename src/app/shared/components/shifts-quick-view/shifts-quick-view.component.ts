import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { IShift } from '@interfaces/shift.interface';
import { ShiftService } from "@services/shift.service";

@Component({
  selector: 'app-shifts-quick-view',
  standalone: true,
  templateUrl: './shifts-quick-view.component.html',
  styleUrl: './shifts-quick-view.component.scss',
  imports: [CommonModule, MatCardModule]
})
export class ShiftsQuickViewComponent {

}
