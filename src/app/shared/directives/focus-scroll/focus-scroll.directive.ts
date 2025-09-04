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
    const offset = isMobile ? 75 : 100;
    const delay = isMobile ? 600 : 200;
    const initialDelay = isMobile ? 300 : 50;
    
    this.isScrolling = true;
    setTimeout(() => {
      const element = this.el.nativeElement as HTMLElement;
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = rect.top + scrollTop - offset;
      
      this.ngZone.runOutsideAngular(() => {
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      });
      
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
        this.scrollComplete.emit();
        this.dropdownReady.emit();
      }, delay);
    }, initialDelay);
  }  @HostListener('blur')
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