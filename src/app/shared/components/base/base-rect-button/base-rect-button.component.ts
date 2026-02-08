import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { BaseButtonDirective } from '@directives/base-button.directive';

@Component({
  selector: 'app-base-rect-button',
  standalone: true,
  imports: [CommonModule, MatIcon, BaseButtonDirective],
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
