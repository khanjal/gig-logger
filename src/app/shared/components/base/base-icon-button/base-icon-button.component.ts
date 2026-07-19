import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-base-icon-button',
  standalone: true,
  imports: [CommonModule, BaseButtonComponent],
  templateUrl: './base-icon-button.component.html'
})
export class BaseIconButtonComponent {
  @Input() public icon?: string;
  @Input() public iconColor?: string;
  @Input() public loading = false;
  @Input() public disabled = false;
  @Input() public type: 'button' | 'submit' | 'reset' = 'button';
  @Input() public class = '';

  @Output() public clicked = new EventEmitter<void>();

  public handleClick(): void {
    this.clicked.emit();
  }
}
