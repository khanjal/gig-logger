import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { BaseButtonDirective } from '@directives/base-button.directive';

@Component({
  selector: 'app-base-fab-button',
  standalone: true,
  imports: [CommonModule, MatIcon, BaseButtonDirective],
  templateUrl: './base-fab-button.component.html'
})
export class BaseFabButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon' = 'primary';
  @Input() fabStyle: 'regular' | 'mini' = 'regular';
  @Input() extended = false;
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() class = '';

  @Output() clicked = new EventEmitter<void>();

  handleClick(): void {
    this.clicked.emit();
  }
}
