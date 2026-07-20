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
  @Input() public item: IDiagnosticRecord = {};
  @Input() public itemType: DiagnosticEntityType = 'trip';
  @Input() public diagnosticName = '';
  @Input() public selectedAddress: string | undefined;

  @Output() public selectedAddressChange = new EventEmitter<string>();
  @Output() public fixShiftDuration = new EventEmitter<IDiagnosticRecord>();
  @Output() public fixTripDuration = new EventEmitter<IDiagnosticRecord>();
  @Output() public applyAddress = new EventEmitter<{ item: IDiagnosticRecord, address: string }>();
  @Output() public createShift = new EventEmitter<IDiagnosticRecord>();

  public onFixShiftDuration(): void {
    this.fixShiftDuration.emit(this.item);
  }

  public onFixTripDuration(): void {
    this.fixTripDuration.emit(this.item);
  }

  public onApplyAddress(): void {
    if (this.selectedAddress) {
      this.applyAddress.emit({ item: this.item, address: this.selectedAddress });
    }
  }

  public onCreateShift(): void {
    this.createShift.emit(this.item);
  }

  public onAddressChange(value: string): void {
    this.selectedAddressChange.emit(value);
  }
}
