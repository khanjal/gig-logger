import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-base-fab-button',
  standalone: true,
  imports: [CommonModule, BaseButtonComponent],
  templateUrl: './base-fab-button.component.html'
})

export class BaseFabButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon' = 'primary';
  @Input() fabStyle: 'regular' | 'mini' | 'micro' = 'regular';
  @Input() extended = false;
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() noBackground = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() class = '';

  @Output() clicked = new EventEmitter<void>();

  handleClick(): void {
    this.clicked.emit();
  }
}
