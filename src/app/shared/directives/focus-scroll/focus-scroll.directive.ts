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
    
    if (!isMobile) {
      // Desktop behavior - simple and immediate
      const element = this.el.nativeElement as HTMLElement;
      const rect = element.getBoundingClientRect();
      const scrollY = window.pageYOffset + rect.top - 90;
      
      window.scrollTo({
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });
      
      this.scrollComplete.emit();
      return;
    }
    
    // Mobile behavior - calculate position before keyboard affects viewport
    const element = this.el.nativeElement as HTMLElement;
    const rect = element.getBoundingClientRect();
    const currentScrollY = window.pageYOffset;
    const elementTop = currentScrollY + rect.top;
    
    // Calculate target scroll position based on current viewport (before keyboard)
    const viewportHeight = window.innerHeight;
    const targetScrollY = elementTop - (viewportHeight * 0.3); // Position element in top 30% of screen
    
    // Wait for keyboard to appear, then scroll to pre-calculated position
    setTimeout(() => {
      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: 'smooth'
      });
      
      this.scrollComplete.emit();
    }, 300);
  }
}