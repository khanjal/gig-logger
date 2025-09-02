import { Directive, ElementRef, EventEmitter, HostListener, Output, Input } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input() focusScrollOffset: number = 100;
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef) { }

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
  }
}
