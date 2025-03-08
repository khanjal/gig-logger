import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { IShift } from '@interfaces/shift.interface';
import { NoSecondsPipe } from "@pipes/no-seconds.pipe";
import { ShiftTripsTableComponent } from "@components/shift-trips-table/shift-trips-table.component";

@Component({
  selector: 'app-shifts-quick-view',
  standalone: true,
  templateUrl: './shifts-quick-view.component.html',
  styleUrl: './shifts-quick-view.component.scss',
  imports: [CommonModule, MatCardModule, MatIconModule, NoSecondsPipe, ShiftTripsTableComponent]
})
export class ShiftsQuickViewComponent {
  @Input() shift: IShift = {} as IShift;
}
