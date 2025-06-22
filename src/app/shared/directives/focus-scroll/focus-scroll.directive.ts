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
    
    // Find the scrollable container (modal or window)
    const getScrollableContainer = (element: HTMLElement): HTMLElement | Window => {
      let parent = element.parentElement;
      
      while (parent) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        
        // Check if this is a modal container
        if (parent.classList.contains('cdk-overlay-pane') || 
            parent.classList.contains('mat-dialog-container') ||
            parent.classList.contains('modal') ||
            parent.classList.contains('mat-dialog-content')) {
          return parent;
        }
        
        // Check if this is a scrollable container
        if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
          return parent;
        }
        
        parent = parent.parentElement;
      }
      
      return window; // Default to window if no scrollable container found
    };
    
    // Small delay to ensure any layout changes from focus are complete
    setTimeout(() => {
      const scrollContainer = getScrollableContainer(inputElement);
      const rect = inputElement.getBoundingClientRect();
      const topOffset = isMobile ? 80 : 60; // More space to keep input visible
      
      if (scrollContainer === window) {
        // Window scrolling (main page)
        const scrollTo = window.pageYOffset + rect.top - topOffset;
        
        if (rect.top > topOffset + 20 || rect.top < topOffset - 20) {
          window.scrollTo({
            top: Math.max(0, scrollTo),
            behavior: 'smooth'
          });
        }
      } else {
        // Modal/container scrolling
        const containerElement = scrollContainer as HTMLElement;
        const containerRect = containerElement.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;
        const scrollTo = containerElement.scrollTop + relativeTop - topOffset;
        
        if (relativeTop > topOffset + 20 || relativeTop < topOffset - 20) {
          containerElement.scrollTo({
            top: Math.max(0, scrollTo),
            behavior: 'smooth'
          });
        }
      }
      
      // On mobile, also handle viewport changes from virtual keyboard
      if (isMobile && scrollContainer === window) {
        const handleViewportChange = () => {
          const newRect = inputElement.getBoundingClientRect();
          const newViewportHeight = window.innerHeight;
          
          if (newRect.bottom > newViewportHeight - 100) {
            const newScrollTo = window.pageYOffset + newRect.top - topOffset;
            window.scrollTo({
              top: Math.max(0, newScrollTo),
              behavior: 'smooth'
            });
          }
        };
        
        setTimeout(handleViewportChange, 300);
      }
      
      this.scrollComplete.emit(); // Emit event after scroll completes
    }, 50);
  }
}