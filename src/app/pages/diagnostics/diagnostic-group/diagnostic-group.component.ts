import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DiagnosticEntityType, IDiagnosticRecord } from '@interfaces/diagnostic.interface';
import { BaseFabButtonComponent } from '@components/base';

@Component({
  selector: 'app-diagnostic-group',
  standalone: true,
  imports: [FormsModule, MatRadioModule, MatButtonModule, MatIconModule, MatTooltipModule, BaseFabButtonComponent],
  templateUrl: './diagnostic-group.component.html',
  styleUrl: './diagnostic-group.component.scss'
})
export class DiagnosticGroupComponent {
  @Input() group: IDiagnosticRecord[] = [];
  @Input() groupIndex = 0;
  @Input() itemType: DiagnosticEntityType = 'trip';
  @Input() selectedValue: IDiagnosticRecord | undefined;
  @Input() selectedShiftToDelete: number | undefined;

  @Output() selectedValueChange = new EventEmitter<IDiagnosticRecord>();
  @Output() selectedShiftToDeleteChange = new EventEmitter<number>();
  @Output() merge = new EventEmitter<{ group: IDiagnosticRecord[], value: IDiagnosticRecord, itemType: DiagnosticEntityType }>();
  @Output() deleteShift = new EventEmitter<{ group: IDiagnosticRecord[], shiftId: number, groupIndex: number }>();

  get canMerge(): boolean {
    return ['place', 'name', 'address', 'service', 'type', 'region'].includes(this.itemType);
  }

  get canDelete(): boolean {
    return this.itemType === 'shift';
  }

  hasMarkedForDelete(group: IDiagnosticRecord[]): boolean {
    return group.some(item => item.markedForDelete);
  }

  onMergeClick(): void {
    if (this.selectedValue) {
      this.merge.emit({ group: this.group, value: this.selectedValue, itemType: this.itemType });
    }
  }

  onDeleteClick(): void {
    if (this.selectedShiftToDelete) {
      this.deleteShift.emit({ group: this.group, shiftId: this.selectedShiftToDelete, groupIndex: this.groupIndex });
    }
  }

  onValueChange(value: IDiagnosticRecord): void {
    this.selectedValueChange.emit(value);
  }

  onShiftChange(value: number): void {
    this.selectedShiftToDeleteChange.emit(value);
  }
}
