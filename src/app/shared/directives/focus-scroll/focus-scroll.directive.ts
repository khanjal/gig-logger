import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[focus-scroll]'
})
export class FocusScrollDirective {

  constructor(private el: ElementRef) { }

  ngOnInit() { }

  @HostListener('focus', ['$event.target']) onFocus() {
    this.el.nativeElement.scrollIntoView();
  }

}
