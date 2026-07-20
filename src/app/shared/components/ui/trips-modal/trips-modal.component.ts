import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BaseFabButtonComponent } from '@components/base';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { ITripsModalData } from '@interfaces/ui/trips-modal-data.interface';

export type { ITripsModalData };

@Component({
  selector: 'app-trips-modal',
  templateUrl: './trips-modal.component.html',
  styleUrls: ['./trips-modal.component.scss'],
  standalone: true,
  imports: [MatIconModule, BaseFabButtonComponent, TripsQuickViewComponent]
})
export class TripsModalComponent {
  public data = inject<ITripsModalData>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<TripsModalComponent>>(MatDialogRef);


  public get tripCount(): number {
    return this.data.trips.length;
  }

  public closeModal(): void {
    this.dialogRef.close();
  }

  public onEditClicked(): void {
    // Close the dialog when edit is clicked
    this.dialogRef.close();
  }

  public trackByTrip(index: number, trip: ITrip): number {
    return trip?.rowId ?? trip?.id ?? index;
  }
}
