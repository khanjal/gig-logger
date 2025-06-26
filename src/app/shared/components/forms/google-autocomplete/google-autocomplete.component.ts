import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServerGooglePlacesService, AutocompleteResult } from '@services/server-google-places.service';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-google-autocomplete',
    templateUrl: './google-autocomplete.component.html',
    styleUrls: ['./google-autocomplete.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CommonModule]
})
export class GoogleAutocompleteComponent implements OnInit, OnDestroy {
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

  suggestions: AutocompleteResult[] = [];
  isLoading = false;
  showSuggestions = false;

  constructor(private serverGooglePlacesService: ServerGooglePlacesService) { }

  async ngOnInit(): Promise<void> {
    this.addressForm.controls.address.setValue(this.address);
    
    // Set up server-side autocomplete with debouncing
    this.addressForm.controls.address.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(async (value) => {
        if (value && value.length > 2) {
          await this.searchPlaces(value);
        } else {
          this.suggestions = [];
          this.showSuggestions = false;
        }
      });
  }

  ngAfterViewInit() {
    setTimeout(() => this.addressInput?.nativeElement?.focus(), 500);
  }

  async searchPlaces(input: string): Promise<void> {
    this.isLoading = true;
    try {
      // Use location bias for better autocomplete results
      const results = await this.serverGooglePlacesService.getAutocompleteWithLocation(
        input,
        'address',
        this.componentRestrictions.country,
        true // Use location bias
      );
      this.suggestions = results;
      this.showSuggestions = true;
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      this.suggestions = [];
    } finally {
      this.isLoading = false;
    }
  }

  onTextChange() {
    const currentValue = this.addressInput.nativeElement.value || "";
    this.addressForm.controls.address.setValue(currentValue);
    this.addressChange.emit(currentValue);
  }

  async selectSuggestion(suggestion: AutocompleteResult): Promise<void> {
    this.addressForm.controls.address.setValue(suggestion.address);
    this.addressChange.emit(suggestion.address);
    this.placeSelected.emit(suggestion);
    this.showSuggestions = false;
    this.suggestions = [];
  }

  onInputFocus(): void {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onInputBlur(): void {
    // Delay hiding suggestions to allow click on suggestion
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions (handled automatically by Angular for valueChanges)
  }
}
