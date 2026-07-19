import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DurationFormatPipe } from '@pipes/duration-format.pipe';
import type { DiagnosticEntityType, IDiagnosticRecord } from '@interfaces/stats/diagnostic.interface';
import { BaseFabButtonComponent } from '@components/base';

@Component({
  selector: 'app-diagnostic-item',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatTooltipModule, DurationFormatPipe, BaseFabButtonComponent],
  templateUrl: './diagnostic-item.component.html',
  styleUrl: './diagnostic-item.component.scss'
})
export class DiagnosticItemComponent {
  @Input() item: IDiagnosticRecord = {};
  @Input() itemType: DiagnosticEntityType = 'trip';
  @Input() diagnosticName = '';
  @Input() selectedAddress: string | undefined;

  @Output() selectedAddressChange = new EventEmitter<string>();
  @Output() fixShiftDuration = new EventEmitter<IDiagnosticRecord>();
  @Output() fixTripDuration = new EventEmitter<IDiagnosticRecord>();
  @Output() applyAddress = new EventEmitter<{ item: IDiagnosticRecord, address: string }>();
  @Output() createShift = new EventEmitter<IDiagnosticRecord>();

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
