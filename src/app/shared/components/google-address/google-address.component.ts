import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleAddress } from '@interfaces/google-address.interface';
import { GoogleAddressService } from '@services/google-address.service';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgIf } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-google-address',
    templateUrl: './google-address.component.html',
    styleUrls: ['./google-address.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, NgIf, MatIconButton, MatSuffix, MatIcon]
})

// https://github.com/karthiktechblog/google-place-autocomplete

export class GoogleAddressComponent implements OnInit {
  @Input() address!: string;
  @Output() addressChange = new EventEmitter<string>();
  
  @ViewChild('address') addressInput!: ElementRef;
  
  // establishmentAddress!: Object;

  place!: any;
  formattedAddress!: string;
  // formattedEstablishmentAddress!: string;

  addressForm = new FormGroup({
    address: new FormControl('')
  });

  googleAddress!: GoogleAddress;

  constructor(private googleAddressService: GoogleAddressService) { }

  async ngOnInit(): Promise<void> {
    this.addressForm.controls.address.setValue(this.address);
  }

  ngAfterViewInit() {
    this.getPlaceAutocomplete();
    
    setTimeout(() => this.addressInput?.nativeElement?.focus(), 500);
  }

  onTextChange() {
    this.addressChange.emit(this.addressForm.value.address || "");
  }

  private getPlaceAutocomplete() {
    //@ts-ignore
    const autocomplete = new google.maps.places.Autocomplete(
      this.addressInput.nativeElement,
      {
        componentRestrictions: { country: 'US' },
        types: ["establishment", "geocode"]  // 'establishment' / 'address' / 'geocode' // we are checking all types
      }
    );

    //@ts-ignore
    google.maps.event.addListener(autocomplete, 'place_changed', () => {
      // $('.pac-container').remove(); // TODO remove existing pac-containers
      this.place = autocomplete.getPlace();
      this.formatAddress();
      this.addressForm.controls.address.setValue(this.formattedAddress);
      this.addressChange.emit(this.formattedAddress);
    });
  }

  private formatAddress() {
    this.formattedAddress = this.googleAddressService.getFormattedAddress(this.place);
    let name = this.place['name'];

    if (!this.formattedAddress.startsWith(name)) {
      this.formattedAddress = `${name}, ${this.formattedAddress}`;
    }
  }
}
