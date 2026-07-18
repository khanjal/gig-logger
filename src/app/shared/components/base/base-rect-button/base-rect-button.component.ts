import { Component, EventEmitter, Input, Output } from '@angular/core';

import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-base-rect-button',
  standalone: true,
  imports: [BaseButtonComponent],
  templateUrl: './base-rect-button.component.html'
})
export class BaseRectButtonComponent {
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() label?: string;
  @Input() variant: 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon' = 'primary';
  @Input() noBackground = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<void>();
}
