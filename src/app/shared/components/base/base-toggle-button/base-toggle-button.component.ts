import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseFabButtonComponent } from '@components/base';

@Component({
  selector: 'app-base-toggle-button',
  standalone: true,
  imports: [CommonModule, BaseFabButtonComponent],
  templateUrl: './base-toggle-button.component.html'
})
export class BaseToggleButtonComponent {
  @Input() active = false;
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() disabled = false;
  @Input() loading = false;
  @Output() clicked = new EventEmitter<void>();
}
