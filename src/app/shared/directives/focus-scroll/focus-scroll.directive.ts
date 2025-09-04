import { Directive, ElementRef, Output, EventEmitter, HostListener, Input, NgZone } from '@angular/core';

@Directive({
  selector: '[focusScroll]',
  standalone: true
})
export class FocusScrollDirective {
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
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    const isMobile = this.isMobileDevice();
    
    if (isMobile) {
      // Mobile: Wait for virtual keyboard, then scroll to top of screen
      this.isScrolling = true;
      setTimeout(() => {
        this.ngZone.runOutsideAngular(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
        
        this.scrollTimeout = setTimeout(() => {
          this.isScrolling = false;
          this.scrollComplete.emit();
          this.dropdownReady.emit();
        }, 600);
      }, 300); // Wait for keyboard to appear
    } else {
      // Desktop: Normal scroll with offset
      const offset = 100;
      this.isScrolling = true;
      setTimeout(() => {
        const element = this.el.nativeElement as HTMLElement;
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - offset;
        
        this.ngZone.runOutsideAngular(() => {
          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });
        });
        
        this.scrollTimeout = setTimeout(() => {
          this.isScrolling = false;
          this.scrollComplete.emit();
          this.dropdownReady.emit();
        }, 200);
      }, 50);
    }
  }

  @HostListener('blur')
  onBlur() {
    this.isScrolling = false;
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  public isCurrentlyScrolling(): boolean {
    return this.isScrolling;
  }
}