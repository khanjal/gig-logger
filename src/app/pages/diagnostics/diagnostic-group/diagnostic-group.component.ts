import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DiagnosticEntityType } from '@interfaces/diagnostic.interface';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-diagnostic-group',
  standalone: true,
  imports: [CommonModule, FormsModule, MatRadioModule, MatButtonModule, MatIconModule, MatTooltipModule, BaseButtonComponent],
  templateUrl: './diagnostic-group.component.html',
  styleUrl: './diagnostic-group.component.scss'
})
export class DiagnosticGroupComponent {
  @Input() group: any[] = [];
  @Input() groupIndex: number = 0;
  @Input() itemType: DiagnosticEntityType = 'trip';
  @Input() selectedValue: any;
  @Input() selectedShiftToDelete: number | undefined;
  
  @Output() selectedValueChange = new EventEmitter<any>();
  @Output() selectedShiftToDeleteChange = new EventEmitter<number>();
  @Output() merge = new EventEmitter<{ group: any[], value: any, itemType: DiagnosticEntityType }>();
  @Output() deleteShift = new EventEmitter<{ group: any[], shiftId: number, groupIndex: number }>();

  get canMerge(): boolean {
    return ['place', 'name', 'address', 'service', 'region'].includes(this.itemType);
  }

  get canDelete(): boolean {
    return this.itemType === 'shift';
  }

  hasMarkedForDelete(group: any[]): boolean {
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

  onValueChange(value: any): void {
    this.selectedValueChange.emit(value);
  }

  onShiftChange(value: number): void {
    this.selectedShiftToDeleteChange.emit(value);
  }
}
