import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-base-toggle-button',
  standalone: true,
  imports: [BaseButtonComponent],
  templateUrl: './base-toggle-button.component.html'
})
export class BaseToggleButtonComponent {
  @Input() public active = false;
  @Input() public icon?: string;
  @Input() public iconColor?: string;
  @Input() public variant?: 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon';
  @Input() public disabled = false;
  @Input() public loading = false;
  @Output() public clicked = new EventEmitter<void>();
}
