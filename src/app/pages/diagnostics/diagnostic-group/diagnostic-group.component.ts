import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { DiagnosticEntityType, IDiagnosticRecord } from '@interfaces/stats/diagnostic.interface';
import { BaseFabButtonComponent } from '@components/base';

@Component({
  selector: 'app-diagnostic-group',
  standalone: true,
  imports: [FormsModule, MatRadioModule, MatButtonModule, MatIconModule, MatTooltipModule, BaseFabButtonComponent],
  templateUrl: './diagnostic-group.component.html',
  styleUrl: './diagnostic-group.component.scss'
})
export class DiagnosticGroupComponent {
  @Input() public group: IDiagnosticRecord[] = [];
  @Input() public groupIndex = 0;
  @Input() public itemType: DiagnosticEntityType = 'trip';
  @Input() public selectedValue: IDiagnosticRecord | undefined;
  @Input() public selectedShiftToDelete: number | undefined;

  @Output() public selectedValueChange = new EventEmitter<IDiagnosticRecord>();
  @Output() public selectedShiftToDeleteChange = new EventEmitter<number>();
  @Output() public merge = new EventEmitter<{ group: IDiagnosticRecord[], value: IDiagnosticRecord, itemType: DiagnosticEntityType }>();
  @Output() public deleteShift = new EventEmitter<{ group: IDiagnosticRecord[], shiftId: number, groupIndex: number }>();

  public get canMerge(): boolean {
    return ['place', 'name', 'address', 'service', 'type', 'region'].includes(this.itemType);
  }

  public get canDelete(): boolean {
    return this.itemType === 'shift';
  }

  public hasMarkedForDelete(group: IDiagnosticRecord[]): boolean {
    return group.some(item => item.markedForDelete);
  }

  public onMergeClick(): void {
    if (this.selectedValue) {
      this.merge.emit({ group: this.group, value: this.selectedValue, itemType: this.itemType });
    }
  }

  public onDeleteClick(): void {
    if (this.selectedShiftToDelete) {
      this.deleteShift.emit({ group: this.group, shiftId: this.selectedShiftToDelete, groupIndex: this.groupIndex });
    }
  }

  public onValueChange(value: IDiagnosticRecord): void {
    this.selectedValueChange.emit(value);
  }

  public onShiftChange(value: number): void {
    this.selectedShiftToDeleteChange.emit(value);
  }
}
