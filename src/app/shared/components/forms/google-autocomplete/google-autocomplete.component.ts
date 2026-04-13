import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoggerService } from '@services/logger.service';
import { ServerGooglePlacesService } from '@services/server-google-places.service';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import type { IAutocompleteResult } from '@interfaces/google-places.interface';

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
  @Output() placeSelected = new EventEmitter<IAutocompleteResult>();
  
  @ViewChild('address') addressInput!: ElementRef;

  addressForm = new FormGroup({
    address: new FormControl('')
  });

  suggestions = signal<IAutocompleteResult[]>([]);
  isLoading = signal(false);
  showSuggestions = signal(false);

  constructor(
    private serverGooglePlacesService: ServerGooglePlacesService,
    private logger: LoggerService
  ) { }

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
          this.suggestions.set([]);
          this.showSuggestions.set(false);
        }
      });
  }

  ngAfterViewInit() {
    setTimeout(() => this.addressInput?.nativeElement?.focus(), 500);
  }

  async searchPlaces(input: string): Promise<void> {
    this.isLoading.set(true);
    try {
      // Use smart autocomplete that only calls Google API if we have user location
      const results = await this.serverGooglePlacesService.getSmartAutocomplete(
        input,
        'address',
        this.componentRestrictions.country
      );
      this.suggestions.set(results);
      this.showSuggestions.set(true);
    } catch (error) {
      this.logger.error('Error fetching autocomplete suggestions:', error);
      this.suggestions.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  onTextChange() {
    const currentValue = this.addressInput.nativeElement.value || "";
    this.addressForm.controls.address.setValue(currentValue);
    this.addressChange.emit(currentValue);
  }

  async selectSuggestion(suggestion: IAutocompleteResult): Promise<void> {
    this.addressForm.controls.address.setValue(suggestion.address);
    this.addressChange.emit(suggestion.address);
    this.placeSelected.emit(suggestion);
    this.showSuggestions.set(false);
    this.suggestions.set([]);
  }

  onInputFocus(): void {
    if (this.suggestions().length > 0) {
      this.showSuggestions.set(true);
    }
  }

  onInputBlur(): void {
    // Delay hiding suggestions to allow click on suggestion
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions (handled automatically by Angular for valueChanges)
  }
}
