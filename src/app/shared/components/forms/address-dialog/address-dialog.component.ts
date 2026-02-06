import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IAddressDialog } from '@interfaces/address-dialog.interface';
import { GoogleAddressComponent } from '../google-address/google-address.component';
import { CommonModule } from '@angular/common';
import { BaseButtonComponent } from '@components/base';

@Component({
    selector: 'app-address-dialog',
    templateUrl: './address-dialog.component.html',
    styleUrls: ['./address-dialog.component.scss'],
    standalone: true,
    imports: [GoogleAddressComponent, CommonModule, BaseButtonComponent]
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
  }

  onConfirm(): void {
    // Close the dialog, return value
    this.cleanUp();
    this.dialogRef.close(this.address);
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.cleanUp();
    this.dialogRef.close(false);
  }

  cleanUp(): void {
    let pacConatiners = document.getElementsByClassName("pac-container");
    
    Array.from(pacConatiners).forEach(pacConatiner => {
      pacConatiner.remove();
    });
  }
}
