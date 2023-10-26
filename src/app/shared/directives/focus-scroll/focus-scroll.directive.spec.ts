// import { Component, ElementRef } from '@angular/core';
// import { FocusScrollDirective } from './focus-scroll.directive';
// import { TestBed } from '@angular/core/testing';
// import { By } from '@angular/platform-browser';

// @Component({
//   template: `
//   <h2 highlight="yellow">Something Yellow</h2>
//   <h2 highlight>The Default (Gray)</h2>
//   <h2>No Highlight</h2>
//   <input #box [highlight]="box.value" value="cyan"/>`
// })

// class TestComponent { }

// describe('FocusScrollDirective', () => {
//   beforeEach(() => {
//     fixture = TestBed.configureTestingModule({
//       declarations: [ FocusScrollDirective, TestComponent ]
//     })
//     .createComponent(TestComponent);
  
//     fixture.detectChanges(); // initial binding
  
//     // all elements with an attached HighlightDirective
//     des = fixture.debugElement.queryAll(By.directive(FocusScrollDirective));
  
//     // the h2 without the HighlightDirective
//     bareH2 = fixture.debugElement.query(By.css('h2:not([highlight])'));
//   });

//   it('should create an instance', () => {
//     const directive = new FocusScrollDirective());
//     expect(directive).toBeTruthy();
//   });
// });
