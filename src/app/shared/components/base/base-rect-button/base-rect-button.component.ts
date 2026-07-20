import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-base-rect-button',
  standalone: true,
  imports: [BaseButtonComponent],
  templateUrl: './base-rect-button.component.html'
})
export class BaseRectButtonComponent {
  @Input() public icon?: string;
  @Input() public iconColor?: string;
  @Input() public label?: string;
  @Input() public variant: 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon' = 'primary';
  @Input() public noBackground = false;
  @Input() public disabled = false;
  @Input() public loading = false;
  @Input() public fullWidth = false;
  @Output() public clicked = new EventEmitter<void>();
}
