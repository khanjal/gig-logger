import { Component, Inject } from '@angular/core';
import { ActionEnum } from '@enums/action.enum';
import { ITrip } from '@interfaces/trip.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-shift-trips-quick-view',
  // standalone: true,
  // imports: [CommonModule, SharedModule],
  templateUrl: './shift-trips-quick-view.component.html',
  styleUrl: './shift-trips-quick-view.component.scss',
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
