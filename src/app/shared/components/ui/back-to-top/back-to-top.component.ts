import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, MatFabButton, MatIcon],
  template: `
    <button 
      mat-fab 
      color="primary" 
      class="!fixed !bottom-6 !right-6 !z-[1000]"
      [style.display]="showButton ? 'flex' : 'none'"
      (click)="scrollToTop()"
      aria-label="Back to Top"
    >
      <mat-icon>arrow_upward</mat-icon>
    </button>
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
