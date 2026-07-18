import { Component } from '@angular/core';


@Component({
  selector: 'app-base-accordion',
  standalone: true,
  imports: [],
  template: `
    <div class="accordion" role="presentation">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./base-accordion.component.scss']
})
export class BaseAccordionComponent {
}
