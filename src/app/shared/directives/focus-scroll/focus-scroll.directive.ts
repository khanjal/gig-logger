import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input('focus-scroll') scrollPosition: string = 'default';
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef) { }  @HostListener('focus')
  onFocus() {
    const isMobile = window.innerWidth <= 768;
    const delay = isMobile ? 300 : 100; // Longer delay on mobile for virtual keyboard
    
    setTimeout(() => {
      const element = this.el.nativeElement as HTMLElement;
      
      // Check if we're in a modal by looking for specific modal classes/attributes
      let isInModal = false;
      let modalParent: HTMLElement | null = null;
      let parent = element.parentElement;
      
      while (parent) {
        const classList = parent.classList;
        // Common modal class names
        if (classList.contains('mat-dialog-container') || 
            classList.contains('modal') || 
            classList.contains('cdk-overlay-pane') ||
            parent.hasAttribute('role') && parent.getAttribute('role') === 'dialog') {
          isInModal = true;
          modalParent = parent;
          break;
        }
        parent = parent.parentElement;
      }
      
      // Determine offset based on scroll position setting and device
      let topOffset = 10; // More offset on mobile for virtual keyboard
      if (this.scrollPosition === 'top') {
        topOffset = 90;
      }

      if (isInModal) {
        topOffset = 25;
      }
      
      if (isInModal && modalParent) {
        // Find scrollable area within the modal
        let scrollableElement = modalParent;
        const descendants = modalParent.querySelectorAll('*');
        for (let i = 0; i < descendants.length; i++) {
          const desc = descendants[i] as HTMLElement;
          const style = window.getComputedStyle(desc);
          if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && 
              desc.scrollHeight > desc.clientHeight) {
            scrollableElement = desc;
            break;
          }
        }
        
        // Scroll within modal
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollableElement.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top;
        const scrollTo = scrollableElement.scrollTop + relativeTop - topOffset;
        
        scrollableElement.scrollTo({
          top: Math.max(0, scrollTo),
          behavior: 'smooth'
        });
      } else {
        // Scroll the window for non-modal contexts
        const rect = element.getBoundingClientRect();
        const scrollY = window.pageYOffset + rect.top - topOffset;
        
        window.scrollTo({
          top: Math.max(0, scrollY),
          behavior: 'smooth'
        });
      }
      
      // Emit completion event
      setTimeout(() => this.scrollComplete.emit(), 300);
    }, delay);
  }
}