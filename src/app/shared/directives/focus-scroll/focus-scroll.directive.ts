import { Directive, ElementRef, EventEmitter, HostListener, Output, Renderer2 } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef, private renderer: Renderer2) { }
  @HostListener('focus', ['$event.target']) onFocus() {
    this.renderer.addClass(this.el.nativeElement, 'focus-scroll');
    
    // Check if we're on mobile (viewport width <= 768px)
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // On mobile, scroll to top with some offset to accommodate virtual keyboard
      // and ensure dropdown has space below while keeping label visible
      const elementRect = this.el.nativeElement.getBoundingClientRect();
      const scrollOffset = Math.max(0, window.pageYOffset + elementRect.top - 80); // 80px from top
      
      window.scrollTo({
        top: scrollOffset,
        behavior: 'smooth'
      });
    } else {
      // On desktop, use standard scrollIntoView
      this.el.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }

    this.scrollComplete.emit(); // Emit event after scroll completes
  }
}