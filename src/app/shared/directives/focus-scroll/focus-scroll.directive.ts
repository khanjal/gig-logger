import { Directive, ElementRef, EventEmitter, HostListener, Output, Renderer2 } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef, private renderer: Renderer2) { }  @HostListener('focus', ['$event.target']) onFocus() {
    this.renderer.addClass(this.el.nativeElement, 'focus-scroll');
    
    const inputElement = this.el.nativeElement;
    const isMobile = window.innerWidth <= 768;
      // Small delay to ensure any layout changes from focus are complete
    setTimeout(() => {
      const rect = inputElement.getBoundingClientRect();
      const topOffset = isMobile ? 80 : 60; // More space to keep input visible
      
      // Calculate scroll position to place input near top of viewport
      const scrollTo = window.pageYOffset + rect.top - topOffset;
      
      // Only scroll if the input isn't already positioned properly
      if (rect.top > topOffset + 20 || rect.top < topOffset - 20) {
        window.scrollTo({
          top: Math.max(0, scrollTo),
          behavior: 'smooth'
        });
      }
      
      // On mobile, also handle viewport changes from virtual keyboard
      if (isMobile) {
        // Listen for viewport changes that might indicate keyboard open/close
        const handleViewportChange = () => {
          const newRect = inputElement.getBoundingClientRect();
          const newViewportHeight = window.innerHeight;
          
          // If input is now too close to bottom (keyboard likely opened), scroll again
          if (newRect.bottom > newViewportHeight - 100) {
            const newScrollTo = window.pageYOffset + newRect.top - topOffset;
            window.scrollTo({
              top: Math.max(0, newScrollTo),
              behavior: 'smooth'
            });
          }
        };
        
        // Use a short timeout to detect keyboard opening
        setTimeout(handleViewportChange, 300);
      }
      
      this.scrollComplete.emit(); // Emit event after scroll completes
    }, 50);
  }
}