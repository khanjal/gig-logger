import { Directive, ElementRef, EventEmitter, HostListener, Output, Renderer2 } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @HostListener('focus')
  onFocus() {
    this.renderer.addClass(this.el.nativeElement, 'focus-scroll');
    const input = this.el.nativeElement as HTMLElement;
    const isMobile = window.innerWidth <= 768;
    const topOffset = isMobile ? 80 : 60;
    setTimeout(() => {
      // Find the nearest scrollable parent (or window)
      let parent = input.parentElement;
      let scrollParent: HTMLElement | Window = window;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
          scrollParent = parent;
          break;
        }
        parent = parent.parentElement;
      }
      // Get bounding rects
      const inputRect = input.getBoundingClientRect();
      if (scrollParent === window) {
        const scrollTo = window.pageYOffset + inputRect.top - topOffset;
        window.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
      } else {
        const parentRect = (scrollParent as HTMLElement).getBoundingClientRect();
        const relativeTop = inputRect.top - parentRect.top;
        const scrollTo = (scrollParent as HTMLElement).scrollTop + relativeTop - topOffset;
        (scrollParent as HTMLElement).scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
      }
      setTimeout(() => this.scrollComplete.emit(), 300);
    }, 30);
  }
}