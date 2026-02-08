import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseButtonComponent } from '@components/base/base-button/base-button.component';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, BaseButtonComponent],
  template: `
    <app-base-button
      [fab]="true"
      [icon]="'arrow_upward'"
      class="!fixed !bottom-6 !right-6 !z-[1000]"
      [style.display]="showButton ? 'flex' : 'none'"
      (clicked)="scrollToTop()"
      aria-label="Back to Top"
    ></app-base-button>
  `
})
export class BackToTopComponent {
  @Input() scrollThreshold = 300;
  showButton = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showButton = scrollPosition > this.scrollThreshold;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
