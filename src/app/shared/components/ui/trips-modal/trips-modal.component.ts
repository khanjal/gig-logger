import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BaseFabButtonComponent } from '@components/base';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';
import type { ITrip } from '@interfaces/trip.interface';
import type { ITripsModalData } from '@interfaces/trips-modal-data.interface';

export type { ITripsModalData };

@Component({
  selector: 'app-trips-modal',
  templateUrl: './trips-modal.component.html',
  styleUrls: ['./trips-modal.component.scss'],
  standalone: true,
  imports: [MatIconModule, BaseFabButtonComponent, TripsQuickViewComponent]
})
export class TripsModalComponent {
  data = inject<ITripsModalData>(MAT_DIALOG_DATA);
  dialogRef = inject<MatDialogRef<TripsModalComponent>>(MatDialogRef);


  get tripCount(): number {
    return this.data.trips.length;
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  onEditClicked(): void {
    // Close the dialog when edit is clicked
    this.dialogRef.close();
  }

  trackByTrip(index: number, trip: ITrip): any {
    return trip?.rowId ?? trip?.id ?? index;
  }
}
