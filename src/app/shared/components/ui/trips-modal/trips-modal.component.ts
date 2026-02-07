import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';
import { ITrip } from '@interfaces/trip.interface';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';

export interface ITripsModalData {
  title: string;
  trips: ITrip[];
}

@Component({
  selector: 'app-trips-modal',
  templateUrl: './trips-modal.component.html',
  styleUrls: ['./trips-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, BaseButtonComponent, TripsQuickViewComponent]
})
export class TripsModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ITripsModalData,
    public dialogRef: MatDialogRef<TripsModalComponent>
  ) {}

  get tripCount(): number {
    return this.data.trips.length;
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  onEditClicked(trip: ITrip): void {
    // Close the dialog when edit is clicked
    this.dialogRef.close();
  }
}
