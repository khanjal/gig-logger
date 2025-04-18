import { Directive, ElementRef, HostBinding, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input('focus-scroll-options') scrollOptions: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start', inline: 'nearest' };

  constructor(private el: ElementRef) {}

  @HostBinding('class')
  elementClass = 'focus-scroll';

  @HostListener('focus', ['$event.target']) onFocus() {
    if (this.el.nativeElement) {
      try {
        // Use scrollIntoView with explicit options
        this.el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      } catch (error) {
        // Fallback: manually scroll to the element's position
        const rect = this.el.nativeElement.getBoundingClientRect();
        window.scrollTo({
          top: rect.top + window.scrollY,
          behavior: 'smooth'
        });
      }
    }
  }
}