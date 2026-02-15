import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-base-rect-button',
  standalone: true,
  imports: [CommonModule, BaseButtonComponent],
  templateUrl: './base-rect-button.component.html'
})
export class BaseRectButtonComponent {
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() variant: 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon' = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<void>();
}
