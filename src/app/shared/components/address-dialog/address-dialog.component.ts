import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IAddressDialog } from '@interfaces/address-dialog.interface';

@Component({
  selector: 'app-address-dialog',
  templateUrl: './address-dialog.component.html',
  styleUrls: ['./address-dialog.component.scss']
})
export class AddressDialogComponent {
  title!: string;
  address!: string;
  trueIcon: string | undefined;
  trueText! :string;
  falseIcon: string | undefined;
  falseText! :string;

  constructor(public dialogRef: MatDialogRef<AddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IAddressDialog) {
    // Update view with given values
    this.title = data.title;
    this.address = data.address;
    this.trueText = data.trueText;
    this.falseText = data.falseText;

    console.log(this.address);
  }

  onConfirm(): void {
    // Close the dialog, return true
    this.dialogRef.close(true);
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }
}
