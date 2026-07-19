import { Component, HostListener, Input } from '@angular/core';
import { BaseFabButtonComponent } from '@components/base';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [BaseFabButtonComponent],
  template: `
    <app-base-fab-button
      [icon]="'arrow_upward'"
      class="!fixed !bottom-6 !right-6 !z-[1000]"
      [style.display]="showButton ? 'flex' : 'none'"
      (clicked)="scrollToTop()"
      aria-label="Back to Top"
    ></app-base-fab-button>
  `
})
export class BackToTopComponent {
  @Input() public scrollThreshold = 300;
  public showButton = false;

  @HostListener('window:scroll', [])
  public onWindowScroll(): void {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showButton = scrollPosition > this.scrollThreshold;
  }

  public scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
