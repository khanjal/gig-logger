import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';

@Component({
  selector: 'log-trip-quick-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, SearchInputComponent],
  templateUrl: './log-trip-quick-form.component.html',
  styleUrls: ['./log-trip-quick-form.component.scss']
})
export class LogTripQuickFormComponent {
  @Input() shiftId?: number;
  @Output() submitTrip = new EventEmitter<{ shiftId?: number; service?: string; pickupTime?: string; dropoffTime?: string; total?: number }>();

  service?: string;
  pickupTime?: string;
  dropoffTime?: string;
  total?: number;

  onServiceChange(value: string) { this.service = value; }
  onSubmit() {
    this.submitTrip.emit({ shiftId: this.shiftId, service: this.service, pickupTime: this.pickupTime, dropoffTime: this.dropoffTime, total: this.total });
  }
}
