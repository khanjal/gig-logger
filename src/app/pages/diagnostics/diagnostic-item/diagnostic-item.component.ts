import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DurationFormatPipe } from '@pipes/duration-format.pipe';
import { DiagnosticEntityType } from '@interfaces/diagnostic.interface';

@Component({
  selector: 'app-diagnostic-item',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule, DurationFormatPipe],
  templateUrl: './diagnostic-item.component.html',
  styleUrl: './diagnostic-item.component.scss'
})
export class DiagnosticItemComponent {
  @Input() item: any = {};
  @Input() itemType: DiagnosticEntityType = 'trip';
  @Input() diagnosticName: string = '';
  @Input() selectedAddress: string | undefined;
  
  @Output() selectedAddressChange = new EventEmitter<string>();
  @Output() fixShiftDuration = new EventEmitter<any>();
  @Output() fixTripDuration = new EventEmitter<any>();
  @Output() applyAddress = new EventEmitter<{ item: any, address: string }>();
  @Output() createShift = new EventEmitter<any>();

  onFixShiftDuration(): void {
    this.fixShiftDuration.emit(this.item);
  }

  onFixTripDuration(): void {
    this.fixTripDuration.emit(this.item);
  }

  onApplyAddress(): void {
    if (this.selectedAddress) {
      this.applyAddress.emit({ item: this.item, address: this.selectedAddress });
    }
  }

  onCreateShift(): void {
    this.createShift.emit(this.item);
  }

  onAddressChange(value: string): void {
    this.selectedAddressChange.emit(value);
  }
}
