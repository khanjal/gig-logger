import { Directive, ElementRef, EventEmitter, HostListener, Output, Renderer2 } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @HostListener('focus', ['$event.target']) onFocus() {
    this.renderer.addClass(this.el.nativeElement, 'focus-scroll');
    this.el.nativeElement.scrollIntoView(true);
    this.scrollComplete.emit(); // Emit event after scroll completes
  }
}