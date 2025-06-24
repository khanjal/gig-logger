import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef) { }

  @HostListener('focus')
  onFocus() {
    const isMobile = window.innerWidth <= 768;
    const delay = isMobile ? 300 : 100;
    setTimeout(() => {
      const element = this.el.nativeElement as HTMLElement;
      const topOffset = 90;
      const rect = element.getBoundingClientRect();
      const scrollY = window.pageYOffset + rect.top - topOffset;
      window.scrollTo({
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });
      setTimeout(() => this.scrollComplete.emit(), 300);
    }, delay);
  }
}