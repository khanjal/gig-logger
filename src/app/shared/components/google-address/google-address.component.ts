import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { GoogleAddress } from '@interfaces/google-address.interface';
import { GoogleAddressService } from '@services/google-address.service';

@Component({
  selector: 'app-google-address',
  templateUrl: './google-address.component.html',
  styleUrls: ['./google-address.component.scss']
})

// https://github.com/karthiktechblog/google-place-autocomplete

export class GoogleAddressComponent {
  showDetails = false;
  @Input() addressType!: string; // establishment or geocode
  @Input() address!: string;
  place!: any;
  @ViewChild('address') addresstext!: ElementRef;
  @ViewChild('pac-container') pacContainer: any;
  
  // establishmentAddress!: Object;

  formattedAddress!: string;
  // formattedEstablishmentAddress!: string;

  addressForm = new FormGroup({
    address: new FormControl('')
  });

  googleAddress!: GoogleAddress;

  constructor(private googleAddressService: GoogleAddressService) { }

  ngOnInit(): void {
    
    //this.initializeAddressForm();
  }

  initializeAddressForm() {
    // const initialAddress : GoogleAddress =  {
    //   addressLine1: '', addressLine2: '', city: '' , state: '', country: '', postalCode: ''
    // };
    // this.googleAddress = initialAddress;
    
    // this.addressForm = this.formBuilder.group({
    //   addressLine1: new FormControl(this.googleAddress.addressLine1, [Validators.required,
    //   Validators.maxLength(200)]),
    //   addressLine2: new FormControl(this.googleAddress.addressLine2),
    //   city: new FormControl(this.googleAddress.city, [Validators.required,
    //   Validators.maxLength(100)]),
    //   state: new FormControl(this.googleAddress?.state, [Validators.required,
    //   Validators.maxLength(50)]),
    //   postalCode: new FormControl(this.googleAddress.postalCode, [Validators.required,
    //   Validators.maxLength(15)]),
    //   country: new FormControl(this.googleAddress?.country, [Validators.required,
    //   Validators.maxLength(50)])
    // });
  }

  ngAfterViewInit() {
    this.getPlaceAutocomplete();
    console.log(this.addresstext);
    const pacContainer = document.querySelector(".pac-container");
    console.log(pacContainer);
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
      this.addresstext.nativeElement.append(this.pacContainer);
      this.place = autocomplete.getPlace();
      this.formattedAddress = this.googleAddressService.getFormattedAddress(this.place);
      this.addressForm.controls['address'].setValue(this.formattedAddress);
      this.showDetails = true;
    });

    // this.addressForm.controls.address.setValue(this.address);
  }
}
