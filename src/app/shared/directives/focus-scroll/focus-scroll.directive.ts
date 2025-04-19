import { Directive, ElementRef, HostBinding, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input('focus-scroll-options') scrollOptions: ScrollIntoViewOptions = { behavior: 'auto', block: 'start', inline: 'nearest' };

  constructor(private el: ElementRef) {}

  @HostBinding('class')
  elementClass = 'focus-scroll';

  @HostListener('focus', ['$event.target']) async onFocus() {
    this.scrollIntoView();
    await this.delay(300); // Adjust delay as needed
    this.scrollIntoView();
  }

  private scrollIntoView() {
    if (this.el.nativeElement) {
      try {
        // Delay to allow keyboard to open
        this.el.nativeElement.scrollIntoView(this.scrollOptions);
      } catch (error) {
        // Fallback: manually scroll to the element's position
        const rect = this.el.nativeElement.getBoundingClientRect();
        window.scrollTo({
          top: rect.top + window.scrollY,
          behavior: 'auto'
        });
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}