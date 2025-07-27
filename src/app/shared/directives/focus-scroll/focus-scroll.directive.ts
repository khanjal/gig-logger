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

  constructor(private el: ElementRef, private ngZone: NgZone) { }

  @HostListener('focus')
  onFocus() {
    const element = this.el.nativeElement as HTMLElement;
    const rect = element.getBoundingClientRect();
    const scrollY = window.pageYOffset + rect.top - this.focusScrollOffset; // Configurable offset
    window.scrollTo({
      top: Math.max(0, scrollY),
      behavior: 'smooth'
    });
    this.scrollComplete.emit();

    // Mobile keyboard handling
    if (this.isMobile()) {
      this.initialInnerHeight = window.innerHeight;
      // Listen for resize (keyboard pop)
      this.removeResizeListener();
      this.ngZone.runOutsideAngular(() => {
        this.resizeListener = () => {
          // Keyboard likely opened if height shrunk
          if (window.innerHeight < this.initialInnerHeight) {
            setTimeout(() => {
              const rect2 = element.getBoundingClientRect();
              const scrollY2 = window.pageYOffset + rect2.top - this.focusScrollOffset;
              window.scrollTo({
                top: Math.max(0, scrollY2),
                behavior: 'smooth'
              });
              this.scrollComplete.emit();
              this.removeResizeListener();
            }, 150); // Wait for keyboard animation
          }
        };
        window.addEventListener('resize', this.resizeListener, { passive: true });
      });
      // Fallback: after 500ms, scroll again in case resize didn't fire
      clearTimeout(this.focusTimeout);
      this.focusTimeout = setTimeout(() => {
        const rect3 = element.getBoundingClientRect();
        const scrollY3 = window.pageYOffset + rect3.top - this.focusScrollOffset;
        window.scrollTo({
          top: Math.max(0, scrollY3),
          behavior: 'smooth'
        });
        this.scrollComplete.emit();
        this.removeResizeListener();
      }, 700);
    }
  }

  @HostListener('blur')
  onBlur() {
    this.removeResizeListener();
    clearTimeout(this.focusTimeout);
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