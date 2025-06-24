import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef) { }  @HostListener('focus')
  onFocus() {
    const element = this.el.nativeElement as HTMLElement;
    const rect = element.getBoundingClientRect();
    const scrollY = window.pageYOffset + rect.top - 100; // Position near top
    
    window.scrollTo({
      top: Math.max(0, scrollY),
      behavior: 'smooth'
    });
    
    this.scrollComplete.emit();
  }
}