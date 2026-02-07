import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServerGooglePlacesService, AutocompleteResult } from '@services/server-google-places.service';
import { LoggerService } from '@services/logger.service';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgIf, CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { BaseButtonComponent } from '@components/base';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-google-address',
    templateUrl: './google-address.component.html',
    styleUrls: ['./google-address.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, NgIf, MatSuffix, MatIcon, CommonModule, BaseButtonComponent]
})
export class GoogleAddressComponent implements OnInit, OnDestroy {
  @Input() address!: string;
  @Output() addressChange = new EventEmitter<string>();
  
  @ViewChild('address') addressInput!: ElementRef;

  suggestions: AutocompleteResult[] = [];
  isLoading = false;
  showSuggestions = false;

  addressForm = new FormGroup({
    address: new FormControl('')
  });

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
      // Use smart autocomplete that only calls Google API if we have user location
      const results = await this.serverGooglePlacesService.getSmartAutocomplete(
        input, 
        'address', 
        'US'
      );
      this.suggestions = results;
      this.showSuggestions = true;
    } catch (error) {
      this.logger.error('Error fetching autocomplete suggestions:', error);
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
