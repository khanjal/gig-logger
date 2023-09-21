import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IAddressDialog } from '@interfaces/address-dialog.interface';

@Component({
  selector: 'app-address-dialog',
  templateUrl: './address-dialog.component.html',
  styleUrls: ['./address-dialog.component.scss']
})
export class AddressDialogComponent {
  title!: string;
  trueIcon: string | undefined;
  trueText! :string;
  falseIcon: string | undefined;
  falseText! :string;

  addressForm = new FormGroup({
    address: new FormControl('')
  });

  constructor(public dialogRef: MatDialogRef<AddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IAddressDialog) {
    // Update view with given values
    this.title = data.title;
    this.addressForm.controls.address.setValue(data.address);
    this.trueText = data.trueText;
    this.falseText = data.falseText;
  }

  onConfirm(): void {
    // Close the dialog, return true
    this.dialogRef.close(this.addressForm.value.address);
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }
}
