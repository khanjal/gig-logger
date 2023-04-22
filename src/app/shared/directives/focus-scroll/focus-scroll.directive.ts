import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[focus-scroll]'
})
export class FocusScrollDirective {

  constructor(private el: ElementRef) { }

  ngOnInit() {

  }

  @HostListener('click', ['$event.target']) onClick() {
    this.el.nativeElement.scrollIntoView()
  }

}
