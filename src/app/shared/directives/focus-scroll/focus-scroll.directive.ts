import { Directive, ElementRef, EventEmitter, HostListener, Output, Input } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input() focusScrollOffset: number = 100;
  @Input() delayDropdownOnMobile: boolean = true; // New option to control dropdown delay
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();
  @Output() scrollStart: EventEmitter<void> = new EventEmitter<void>();
  @Output() dropdownReady: EventEmitter<void> = new EventEmitter<void>(); // Emitted when safe to open dropdown

  private isScrolling = false;
  private scrollTimeout?: any;

  constructor(private el: ElementRef) { }

  @HostListener('focus')
  onFocus() {
    const isMobile = this.isMobileDevice();
    const hasVirtualKeyboard = this.hasVirtualKeyboard();
    
    this.scrollStart.emit();
    this.isScrolling = true;

    const element = this.el.nativeElement as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    // Smart scroll calculation - only scroll if element is not well positioned
    const viewportHeight = window.innerHeight;
    const currentTop = rect.top;
    const currentBottom = rect.bottom;
    
    // Don't scroll if element is already well-positioned in viewport
    const minAcceptableTop = 50; // Minimum distance from top edge
    const maxAcceptableBottom = viewportHeight - 100; // Leave space for virtual keyboard
    
    let targetScrollY = window.pageYOffset; // Default: don't scroll
    
    if (currentTop < minAcceptableTop) {
      // Element is too close to top or cut off - scroll to bring it down
      targetScrollY = window.pageYOffset + currentTop - Math.min(this.focusScrollOffset, 100);
    } else if (currentBottom > maxAcceptableBottom) {
      // Element is too close to bottom or cut off - scroll to bring it up  
      targetScrollY = window.pageYOffset + currentTop - Math.min(this.focusScrollOffset, 150);
    } else if (isMobile && hasVirtualKeyboard && currentBottom > viewportHeight * 0.6) {
      // On mobile with virtual keyboard, ensure element is in upper portion
      targetScrollY = window.pageYOffset + currentTop - Math.min(this.focusScrollOffset, 120);
    }
    
    // Clear any existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Only scroll if we calculated a different position
    if (Math.abs(targetScrollY - window.pageYOffset) > 10) {
      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: 'smooth'
      });
    }

    // Calculate delay based on device and keyboard
    let delay = 100; // Base delay for scroll animation
    
    if (isMobile && hasVirtualKeyboard && this.delayDropdownOnMobile) {
      // On mobile with virtual keyboard, wait longer for keyboard animation
      delay = 600;
    } else if (isMobile && this.delayDropdownOnMobile) {
      // On mobile without virtual keyboard, moderate delay
      delay = 300;
    }

    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.scrollComplete.emit();
      this.dropdownReady.emit();
    }, delay);
  }

  @HostListener('blur')
  onBlur() {
    // Clean up when focus is lost
    this.isScrolling = false;
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private hasVirtualKeyboard(): boolean {
    // Check if this is an input that would trigger virtual keyboard
    const element = this.el.nativeElement as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    const inputType = element.getAttribute('type')?.toLowerCase();
    
    return tagName === 'input' && 
           (inputType === 'text' || inputType === 'email' || inputType === 'tel' || 
            inputType === 'url' || inputType === 'search' || !inputType);
  }

  public isCurrentlyScrolling(): boolean {
    return this.isScrolling;
  }
}
