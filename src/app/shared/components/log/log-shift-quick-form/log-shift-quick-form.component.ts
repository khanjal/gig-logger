import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';
import { DateHelper } from '@helpers/date.helper';

@Component({
  selector: 'log-shift-quick-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, SearchInputComponent],
  templateUrl: './log-shift-quick-form.component.html',
  styleUrls: ['./log-shift-quick-form.component.scss']
})
export class LogShiftQuickFormComponent {
  @Input() nextNumber: number = 1;
  @Output() submitShift = new EventEmitter<{ dateISO: string; service: string; region?: string }>();
  @Output() recomputeNumber = new EventEmitter<{ dateISO: string; service: string }>();
  @Output() cancel = new EventEmitter<void>();

  dateModel: Date = new Date();
  service: string = '';
  region: string = '';

  onDateChange() {
    const dateISO = DateHelper.toISO(this.dateModel);
    this.recomputeNumber.emit({ dateISO, service: this.service });
  }

  onServiceChange(value: string) {
    this.service = value;
    const dateISO = DateHelper.toISO(this.dateModel);
    this.recomputeNumber.emit({ dateISO, service: this.service });
  }

  onSubmit() {
    const dateISO = DateHelper.toISO(this.dateModel);
    this.submitShift.emit({ dateISO, service: this.service, region: this.region });
  }

  onCancel() {
    this.cancel.emit();
  }
}
