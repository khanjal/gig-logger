import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [CommonModule, MatButtonModule, MatIconModule, TripsQuickViewComponent]
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
