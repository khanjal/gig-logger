import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { BaseButtonDirective } from '@directives/base-button.directive';

@Component({
  selector: 'app-base-field-button',
  standalone: true,
  imports: [CommonModule, MatIcon, BaseButtonDirective],
  templateUrl: './base-field-button.component.html'
})
export class BaseFieldButtonComponent {
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() noBackground: boolean = true;
  @Input() fab: boolean = false;
  @Input() fabStyle: 'regular' | 'mini' = 'regular';
  @Input() color?: string;
  @Input('aria-label') ariaLabel?: string;
  @Input() title?: string;
  @Output() clicked = new EventEmitter<void>();

  get variant(): 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon' {
    if (!this.color) return 'icon';
    if (this.color === 'accent') return 'secondary';
    if (this.color === 'primary') return 'primary';
    if (this.color === 'outlined') return 'outlined';
    if (this.color === 'danger') return 'danger';
    return 'icon';
  }
}
