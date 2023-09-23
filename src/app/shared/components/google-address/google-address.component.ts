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
  @Input() addressType!: string; // establishment or geocode
  @Input() address!: string;
  @Output() addressChange = new EventEmitter<string>();
  
  @ViewChild('address') addresstext!: ElementRef;
  
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
  }

  private getPlaceAutocomplete() {
    const autocomplete = new google.maps.places.Autocomplete(
      this.addresstext.nativeElement,
      {
        componentRestrictions: { country: 'US' },
        types: [this.addressType]  // 'establishment' / 'address' / 'geocode' // we are checking all types
      }
    );

    google.maps.event.addListener(autocomplete, 'place_changed', () => {
      this.place = autocomplete.getPlace();
      this.formattedAddress = this.googleAddressService.getFormattedAddress(this.place);
      this.addressForm.controls.address.setValue(this.formattedAddress);
      this.addressChange.emit(this.formattedAddress);
    });

    // this.addresstext.nativeElement.focus();
    // this.addresstext.nativeElement.select();
  }
}
