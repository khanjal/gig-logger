import { Directive, ElementRef, HostBinding, HostListener } from '@angular/core';

@Directive({
  selector: '[focus-scroll]',
  standalone: true
})
export class FocusScrollDirective {

  constructor(private el: ElementRef) { }

  ngOnInit() { }

  @HostBinding('class') 
  elementClass = 'focus-scroll';

  @HostListener('focus', ['$event.target']) onFocus() {
    this.el.nativeElement.scrollIntoView(true);
  }

}
