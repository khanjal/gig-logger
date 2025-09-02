import { Directive, ElementRef, EventEmitter, HostListener, Output, Input, NgZone } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input() focusScrollOffset: number = 100;
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  private resizeListener: (() => void) | null = null;
  private initialInnerHeight: number = 0;
  private focusTimeout: any;
  private hasScrolled: boolean = false;

  constructor(private el: ElementRef, private ngZone: NgZone) { }

  @HostListener('focus')
  onFocus() {
    const element = this.el.nativeElement as HTMLElement;
    this.hasScrolled = false; // Reset scroll flag

    // Always use the simple, working scroll method that doesn't break dropdowns
    this.performScroll(element);

    // Add mobile keyboard handling WITHOUT changing the scroll behavior
    if (this.isMobile()) {
      // Add body class for old Android viewport handling
      document.body.classList.add('keyboard-open');

      // Force resize events for old Android devices
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }, 50);

      this.initialInnerHeight = window.innerHeight;
      this.removeResizeListener();
      
      // Set up resize listener for additional scroll when keyboard appears
      this.ngZone.runOutsideAngular(() => {
        this.resizeListener = () => {
          if (window.innerHeight < this.initialInnerHeight && !this.hasScrolled) {
            setTimeout(() => {
              if (!this.hasScrolled) {
                // Use the same scroll method that works for dropdowns
                this.performScroll(element);
              }
              this.removeResizeListener();
            }, 150);
          }
        };
        window.addEventListener('resize', this.resizeListener, { passive: true });
      });

      // Fallback timeout in case resize event doesn't fire
      clearTimeout(this.focusTimeout);
      this.focusTimeout = setTimeout(() => {
        if (!this.hasScrolled) {
          this.performScroll(element);
        }
        this.removeResizeListener();
      }, 700);
    }
  }

  @HostListener('blur')
  onBlur() {
    this.removeResizeListener();
    clearTimeout(this.focusTimeout);
    this.hasScrolled = false; // Reset flag on blur

    // Remove body class for old Android viewport handling
    if (this.isMobile()) {
      document.body.classList.remove('keyboard-open');

      // Force resize event when keyboard closes
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }

  private performScroll(element: HTMLElement) {
    if (this.hasScrolled) return; // Prevent multiple scrolls

    this.hasScrolled = true;

    // Use the simple, working scroll method that doesn't break dropdowns
    const rect = element.getBoundingClientRect();
    const scrollY = window.pageYOffset + rect.top - this.focusScrollOffset;
    
    window.scrollTo({
      top: Math.max(0, scrollY),
      behavior: 'smooth'
    });

    this.scrollComplete.emit();
  }

  private removeResizeListener() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
