import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import type { ControlValueAccessor} from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { BaseFieldButtonComponent } from '@components/base/base-field-button/base-field-button.component';

@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    NgxMatTimepickerModule,
    BaseFieldButtonComponent
  ],
  templateUrl: './time-input.component.html',
  styleUrls: ['./time-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeInputComponent),
      multi: true
    }
  ]
})
export class TimeInputComponent implements ControlValueAccessor {
  @Input() public label = 'Time';
  @Input() public placeholder = 'Select time';
  @Input() public fieldClass = 'field-third-width';
  @Input() public disabled = false;

  @Output() public timeChanged = new EventEmitter<string>();

  public value = '';
  
  private onChange = (_value: string) => {};
  private onTouched = () => {};

  public setCurrentTime() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    this.value = currentTime;
    this.onChange(currentTime);
    this.onTouched();
    this.timeChanged.emit(currentTime);
  }

  public clearTime() {
    this.value = '';
    this.onChange('');
    this.onTouched();
    this.timeChanged.emit('');
  }

  public onTimeChange(event: unknown) {
    // Handle different event types from ngx-mat-timepicker
    let timeValue: string;

    const eventObj = event as { target?: { value?: string }; value?: string } | null | undefined;
    if (eventObj?.target?.value) {
      timeValue = eventObj.target.value;
    } else if (typeof event === 'string') {
      timeValue = event;
    } else if (eventObj && typeof eventObj === 'object' && eventObj.value) {
      timeValue = eventObj.value;
    } else {
      timeValue = (event as string) || '';
    }
    
    this.value = timeValue;
    this.onChange(timeValue);
    this.onTouched();
    this.timeChanged.emit(timeValue);
  }

  // ControlValueAccessor methods
  public writeValue(value: string): void {
    this.value = value || '';
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}