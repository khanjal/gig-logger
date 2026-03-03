import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BaseIconButtonComponent } from '@components/base/base-icon-button/base-icon-button.component';

@Component({
  selector: 'app-base-accordion-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, BaseIconButtonComponent],
  template: `
    <div class="accordion-item">
      <div class="accordion-header-row" [class.has-action]="!!actionIcon">
        <button class="accordion-header" (click)="toggle()" [attr.aria-expanded]="expanded">
          <span class="title">{{ title }}</span>
          <mat-icon class="chev" aria-hidden="true">{{ expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
        </button>
        <app-base-icon-button
          *ngIf="actionIcon"
          class="accordion-action"
          [icon]="actionIcon"
          [iconColor]="actionIconColor"
          [disabled]="actionDisabled"
          (clicked)="actionClicked.emit()">
        </app-base-icon-button>
      </div>
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
  @Input() actionIcon?: string;
  @Input() actionIconColor?: string;
  @Input() actionDisabled = false;
  @Output() toggled = new EventEmitter<boolean>();
  @Output() actionClicked = new EventEmitter<void>();

  @HostBinding('class.accordion-item-host') host = true;

  toggle() {
    this.expanded = !this.expanded;
    this.toggled.emit(this.expanded);
  }
}
