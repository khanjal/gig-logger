import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input('focus-scroll-options') scrollOptions: ScrollIntoViewOptions = { behavior: 'auto', block: 'start', inline: 'nearest' };
  @Output() scrollComplete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  @HostListener('focus', ['$event.target']) onFocus() {
    if (this.el.nativeElement) {
      const adjustScroll = () => {
        this.el.nativeElement.scrollIntoView(this.scrollOptions);
        window.removeEventListener('resize', adjustScroll); // Remove listener after adjustment
        this.scrollComplete.emit(); // Emit event after scroll completes
      };

      // Add a resize listener to handle viewport changes caused by the keyboard
      window.addEventListener('resize', adjustScroll);

      // Fallback: Scroll immediately in case resize doesn't trigger
      setTimeout(() => {
        this.el.nativeElement.scrollIntoView(this.scrollOptions);
        this.scrollComplete.emit(); // Emit event after scroll completes
      }, 300); // Adjust delay as needed
    }
  }
}