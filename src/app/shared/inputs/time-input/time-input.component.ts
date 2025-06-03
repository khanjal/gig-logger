import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';

@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    NgxMatTimepickerModule
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
  @Input() label: string = 'Time';
  @Input() placeholder: string = 'Select time';
  @Input() fieldClass: string = 'field-third-width';
  @Input() disabled: boolean = false;
  @Input() showCurrentTimeButton: boolean = true;

  @Output() timeChanged = new EventEmitter<string>();

  value: string = '';
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  setCurrentTime() {
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

  clearTime() {
    this.value = '';
    this.onChange('');
    this.onTouched();
    this.timeChanged.emit('');
  }

  onTimeChange(event: any) {
    const timeValue = event?.target?.value || event;
    this.value = timeValue;
    this.onChange(timeValue);
    this.onTouched();
    this.timeChanged.emit(timeValue);
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}