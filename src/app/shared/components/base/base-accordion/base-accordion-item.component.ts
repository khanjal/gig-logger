import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-base-accordion-item',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="accordion-item">
      <button class="accordion-header" (click)="toggle()" [attr.aria-expanded]="expanded">
        <span class="title">{{ title }}</span>
        <mat-icon class="chev" aria-hidden="true">{{ expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
      </button>
      <div class="accordion-body" [hidden]="!expanded" role="region">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./base-accordion-item.component.scss']
})
export class BaseAccordionItemComponent {
  @Input() title = '';
  @Input() expanded = false;
  @Output() toggled = new EventEmitter<boolean>();

  @HostBinding('class.accordion-item-host') host = true;

  toggle() {
    this.expanded = !this.expanded;
    this.toggled.emit(this.expanded);
  }
}
