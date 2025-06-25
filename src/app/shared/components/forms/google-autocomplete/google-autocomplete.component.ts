import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleAutocompleteService, AutocompleteResult } from '@services/google-autocomplete.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-google-autocomplete',
    templateUrl: './google-autocomplete.component.html',
    styleUrls: ['./google-autocomplete.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CommonModule]
})
export class GoogleAutocompleteComponent implements OnInit {
  @Input() address!: string;
  @Input() placeholder: string = 'Enter address';
  @Input() searchType: string = 'address'; // 'address', 'place', 'business'
  @Input() componentRestrictions: { country: string } = { country: 'US' };
  
  @Output() addressChange = new EventEmitter<string>();
  @Output() placeSelected = new EventEmitter<AutocompleteResult>();
  
  @ViewChild('address') addressInput!: ElementRef;

  addressForm = new FormGroup({
    address: new FormControl('')
  });

  constructor(private googleAutocompleteService: GoogleAutocompleteService) { }

  async ngOnInit(): Promise<void> {
    this.addressForm.controls.address.setValue(this.address);
    
    // Wait for Google Maps to load
    const isLoaded = await this.googleAutocompleteService.waitForGoogleMaps();
    if (!isLoaded) {
      console.error('Failed to load Google Maps API');
    }
  }

  ngAfterViewInit() {
    this.setupAutocomplete();
    
    setTimeout(() => this.addressInput?.nativeElement?.focus(), 500);
  }
  onTextChange() {
    const currentValue = this.addressInput.nativeElement.value || "";
    this.addressForm.controls.address.setValue(currentValue);
    this.addressChange.emit(currentValue);
  }
  private async setupAutocomplete() {
    if (!this.googleAutocompleteService.isGoogleMapsLoaded()) {
      console.warn('Google Maps not loaded, waiting...');
      const isLoaded = await this.googleAutocompleteService.waitForGoogleMaps();
      if (!isLoaded) {
        console.error('Failed to load Google Maps API');
        return;
      }
    }

    await this.googleAutocompleteService.getPlaceAutocomplete(
      this.addressInput,
      this.searchType,
      (result: AutocompleteResult) => {
        // Update the form control value
        this.addressForm.controls.address.setValue(result.address);
        this.addressChange.emit(result.address);
        this.placeSelected.emit(result);
        
        // Since PlaceAutocompleteElement replaces the input, we need to reconnect the change listener
        this.reconnectChangeListener();
      },
      {
        componentRestrictions: this.componentRestrictions,
        fields: ['place_id', 'formatted_address', 'name', 'address_components', 'geometry']
      }
    );
  }

  private reconnectChangeListener() {
    // Reconnect the input change listener after PlaceAutocompleteElement replacement
    if (this.addressInput && this.addressInput.nativeElement) {
      this.addressInput.nativeElement.addEventListener('input', () => {
        this.onTextChange();
      });
    }
  }

  ngOnDestroy() {
    if (this.addressInput) {
      this.googleAutocompleteService.clearAddressListeners(this.addressInput);
    }
  }
}
