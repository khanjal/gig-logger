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
      const adjustScroll = () => {
        this.el.nativeElement.scrollIntoView(this.scrollOptions);
        window.removeEventListener('resize', adjustScroll); // Remove listener after adjustment
      };

      // Add a resize listener to handle viewport changes caused by the keyboard
      window.addEventListener('resize', adjustScroll);

      // Fallback: Scroll immediately in case resize doesn't trigger
      setTimeout(() => {
        this.el.nativeElement.scrollIntoView(this.scrollOptions);
      }, 300); // Adjust delay as needed
    }
  }
}