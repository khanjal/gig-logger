import { CommonModule } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, Input, forwardRef, inject, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import type { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import type { MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { TagService } from '@services/tag.service';
import { TAG_INPUT } from '@constants/tag.constants';

/**
 * Multi-value tag entry backed by the tags already in use.
 *
 * Deliberately separate from app-search-input: that one is single-value, tied to a fixed set of
 * search types and wired into Google Places. Tags are free text with no server-side vocabulary, so
 * sharing it would have meant bending it out of shape.
 */
@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './tag-input.component.html',
  styleUrl: './tag-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
})
export class TagInputComponent implements OnInit {
  private _tagService = inject(TagService);

  @Input() public fieldName = TAG_INPUT.DEFAULT_LABEL;
  @Input() public placeholder = TAG_INPUT.PLACEHOLDER;

  public readonly tags = signal<string[]>([]);
  public readonly suggestions = signal<string[]>([]);
  public readonly disabled = signal(false);
  public readonly separatorKeyCodes = TAG_INPUT.SEPARATOR_KEY_CODES;
  public readonly inputControl = new FormControl('');

  private _onChange: (value: string[]) => void = () => undefined;
  private _onTouched: () => void = () => undefined;

  public async ngOnInit(): Promise<void> {
    await this.refreshSuggestions('');
  }

  // #region ControlValueAccessor
  public writeValue(value: string[] | string | null | undefined): void {
    // Tolerates the raw sheet string as well as the array, so a control bound before
    // deserialization has run still renders something sensible rather than throwing.
    this.tags.set(Array.isArray(value) ? [...value] : this.splitRaw(value));
  }

  public registerOnChange(fn: (value: string[]) => void): void {
    this._onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
  // #endregion

  public async add(event: MatChipInputEvent): Promise<void> {
    const added = this.commit(event.value);

    if (added) {
      event.chipInput?.clear();
      this.inputControl.setValue('');
    }

    await this.refreshSuggestions('');
  }

  public async selected(event: MatAutocompleteSelectedEvent): Promise<void> {
    this.commit(event.option.viewValue);
    this.inputControl.setValue('');
    await this.refreshSuggestions('');
  }

  public async remove(tag: string): Promise<void> {
    this.tags.update(current => current.filter(existing => existing !== tag));
    this.publish();
    await this.refreshSuggestions(this.inputControl.value ?? '');
  }

  public async onInput(value: string): Promise<void> {
    await this.refreshSuggestions(value);
  }

  public onBlur(): void {
    this._onTouched();
  }

  /**
   * Adds a tag if it is non-empty and not already present. Comparison is case-insensitive so a
   * driver does not end up with both "Rain" and "rain" as separate tags.
   */
  private commit(raw: string | null | undefined): boolean {
    const value = (raw ?? '').trim();

    if (value.length === 0) {
      return false;
    }

    const alreadyPresent = this.tags().some(tag => tag.toLowerCase() === value.toLowerCase());

    if (alreadyPresent) {
      return true; // Treat as handled: clear the input rather than leaving a duplicate sitting there.
    }

    this.tags.update(current => [...current, value]);
    this.publish();

    return true;
  }

  private publish(): void {
    this._onChange(this.tags());
  }

  private splitRaw(value: string | null | undefined): string[] {
    if (typeof value !== 'string') {
      return [];
    }

    return value.split(TAG_INPUT.SEPARATOR).map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  private async refreshSuggestions(query: string): Promise<void> {
    this.suggestions.set(await this._tagService.suggest(query, this.tags()));
  }
}
