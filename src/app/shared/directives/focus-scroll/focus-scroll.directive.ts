import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef) { }
  @HostListener('focus')
  onFocus() {
    const isMobile = window.innerWidth <= 768;
    const delay = isMobile ? 600 : 200; // Longer delay for mobile to account for keyboard
    
    setTimeout(() => {
      const element = this.el.nativeElement as HTMLElement;
      const topOffset = isMobile ? 120 : 90; // More offset on mobile for keyboard
      const rect = element.getBoundingClientRect();
      const scrollY = window.pageYOffset + rect.top - topOffset;
      
      window.scrollTo({
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });
      
      // Emit immediately after scroll is initiated
      this.scrollComplete.emit();
    }, delay);
  }
}