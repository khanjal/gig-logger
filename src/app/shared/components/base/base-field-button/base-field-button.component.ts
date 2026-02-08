import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-base-field-button',
  standalone: true,
  imports: [CommonModule, BaseButtonComponent],
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
}
