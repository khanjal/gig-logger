import { Component, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-base-accordion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="accordion" role="presentation">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./base-accordion.component.scss']
})
export class BaseAccordionComponent implements AfterContentInit {
  ngAfterContentInit() {
    // ensure only one open by default — items manage their own state but this
    // provides a hook for future single-open behavior.
  }
}
