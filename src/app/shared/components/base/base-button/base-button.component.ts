import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-base-button',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './base-button.component.html',
  styleUrl: './base-button.component.scss'
})
export class BaseButtonComponent {
  /** Button variant style */
  @Input() variant: ButtonVariant = 'primary';

  /** Button size */
  @Input() size: ButtonSize = 'md';

  /** Icon name (Material icon) */
  @Input() icon?: string;

  /** Icon position (left/right) */
  @Input() iconPosition: 'left' | 'right' = 'left';

  /** Disabled state */
  @Input() disabled = false;

  /** Loading state - shows spinner and disables button */
  @Input() loading = false;

  /** Full width button */
  @Input() fullWidth = false;

  /** Click event emitter */
  @Output() clicked = new EventEmitter<void>();

  onButtonClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }

  get buttonClasses(): string {
    const classes = [
      'app-base-button',
      `btn-${this.variant}`,
      `btn-${this.size}`,
      this.disabled ? 'btn-disabled' : '',
      this.loading ? 'btn-loading' : '',
      this.fullWidth ? 'btn-full-width' : ''
    ];
    return classes.filter(c => c).join(' ');
  }
}
