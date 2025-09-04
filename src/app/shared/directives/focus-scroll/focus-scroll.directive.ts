import { Directive, ElementRef, Output, EventEmitter, HostListener, Input, NgZone } from '@angular/core';

@Directive({
  selector: '[focusScroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input() focusScrollOffset: number = 100;
  @Input() delayDropdownOnMobile: boolean = true;
  
  @Output() scrollComplete = new EventEmitter<void>();
  @Output() scrollStart = new EventEmitter<void>();
  @Output() dropdownReady = new EventEmitter<void>();

  private scrollTimeout: any;
  private isScrolling = false;

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent) {
    this.scrollStart.emit();
    
    // Clear any existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Detect mobile device and virtual keyboard scenario
    const isMobile = this.isMobileDevice();
    const hasVirtualKeyboard = this.hasVirtualKeyboard();
    
    // Calculate delay based on device and input type
    let delay = 200; // Default delay
    
    if (isMobile && hasVirtualKeyboard) {
      // Mobile with virtual keyboard needs longer delay
      delay = 600;
    } else if (isMobile) {
      // Mobile without virtual keyboard
      delay = 300;
    }

    this.isScrolling = true;

    // Scroll to element after a short delay
    setTimeout(() => {
      const element = this.el.nativeElement as HTMLElement;
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Calculate target scroll position
      const targetY = rect.top + scrollTop - this.focusScrollOffset;
      
      // Smooth scroll using NgZone for better performance
      this.ngZone.runOutsideAngular(() => {
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      });
      
      // Set completion timeout
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
        this.scrollComplete.emit();
        this.dropdownReady.emit();
      }, delay);
    }, 50); // Small initial delay to let focus complete
  }

  @HostListener('blur')
  onBlur() {
    // Clear scroll state on blur
    this.isScrolling = false;
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private hasVirtualKeyboard(): boolean {
    // Check if this is likely to trigger a virtual keyboard
    const element = this.el.nativeElement as HTMLElement;
    const inputTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'number'];
    
    if (element.tagName === 'INPUT') {
      const inputType = (element as HTMLInputElement).type;
      return inputTypes.includes(inputType);
    }
    
    return element.tagName === 'TEXTAREA' || element.hasAttribute('contenteditable');
  }

  public isCurrentlyScrolling(): boolean {
    return this.isScrolling;
  }
}