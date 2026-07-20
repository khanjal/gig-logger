import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-base-field-button',
  standalone: true,
  imports: [BaseButtonComponent],
  templateUrl: './base-field-button.component.html'
})
export class BaseFieldButtonComponent {
  @Input() public icon?: string;
  @Input() public iconColor = 'var(--color-text-primary)';
  @Input() public size: 'sm' | 'md' | 'lg' = 'sm';
  @Input() public disabled = false;
  @Input() public loading = false;
  @Input() public fab = false;
  @Input() public fabStyle: 'regular' | 'mini' = 'regular';
  @Input() public color?: string;
  @Input('aria-label') public ariaLabel?: string;
  @Input() public title?: string;
  @Output() public clicked = new EventEmitter<void>();

  public get variant(): 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon' {
    if (!this.color) return 'icon';
    if (this.color === 'accent') return 'secondary';
    if (this.color === 'primary') return 'primary';
    if (this.color === 'outlined') return 'outlined';
    if (this.color === 'danger') return 'danger';
    return 'icon';
  }
}
