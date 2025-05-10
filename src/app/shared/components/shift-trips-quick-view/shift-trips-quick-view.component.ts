import { Component, Inject } from '@angular/core';
import { ActionEnum } from '@enums/action.enum';
import { ITrip } from '@interfaces/trip.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TripsQuickViewComponent } from '../trips-quick-view/trips-quick-view.component';

@Component({
    selector: 'app-shift-trips-quick-view',
    // standalone: true,
    // imports: [CommonModule, SharedModule],
    templateUrl: './shift-trips-quick-view.component.html',
    styleUrl: './shift-trips-quick-view.component.scss',
    standalone: true,
    imports: [
        MatIconButton,
        MatIcon,
        NgClass,
        TripsQuickViewComponent,
    ],
})
export class ShiftTripsQuickViewComponent {
  actionEnum = ActionEnum;

  constructor(
    @Inject(MAT_DIALOG_DATA) public trips: ITrip[],
    private dialogRef: MatDialogRef<ShiftTripsQuickViewComponent>
  ) {}

  closeModal() {
    this.dialogRef.close();
  }
}
