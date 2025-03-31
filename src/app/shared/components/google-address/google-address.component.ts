import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { GoogleAddress } from '@interfaces/google-address.interface';
import { GoogleAddressService } from '@services/google-address.service';

@Component({
  selector: 'app-google-address',
  templateUrl: './google-address.component.html',
  styleUrls: ['./google-address.component.scss']
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
    this.attachPacContainer();
    
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

  private attachPacContainer() {
    const pacContainer = document.querySelector('.pac-container');
    if (pacContainer && this.addressInput) {
      const parent = this.addressInput.nativeElement.closest('mat-form-field');
      if (parent) {
        parent.appendChild(pacContainer);
      }
    }
  }
}
