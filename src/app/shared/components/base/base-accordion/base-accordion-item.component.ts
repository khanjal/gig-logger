import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-base-accordion-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="accordion-item">
      <button class="accordion-header" (click)="toggle()" [attr.aria-expanded]="expanded">
        <span class="title">{{ title }}</span>
        <span class="chev" aria-hidden="true">{{ expanded ? '▾' : '▸' }}</span>
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
