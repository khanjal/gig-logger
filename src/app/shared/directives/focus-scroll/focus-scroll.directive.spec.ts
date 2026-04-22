import { Component, DebugElement } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FocusScrollDirective } from './focus-scroll.directive';
import { ViewportService } from '@services/viewport.service';
import { BehaviorSubject } from 'rxjs';

class MockViewportService {
	private subj = new BehaviorSubject({ height: 500, offsetTop: 0, keyboardHeight: 200, windowInnerHeight: 800 });
	public viewportChange$ = this.subj.asObservable();
	public getSnapshot() { return this.subj.getValue(); }
	start() {}
	stop() {}
	emit(v: any) { this.subj.next(v); }
}

@Component({
	template: `<input focusScroll [enableBottomPadding]="true" />`
})
class TestHostComponent {}

describe('FocusScrollDirective (integration)', () => {
	let fixture: any;
	let inputDe: DebugElement;
	let mockViewport: MockViewportService;

	beforeEach(() => {
		mockViewport = new MockViewportService();

		TestBed.configureTestingModule({
			declarations: [TestHostComponent, FocusScrollDirective],
			providers: [{ provide: ViewportService, useValue: mockViewport }]
		});

		fixture = TestBed.createComponent(TestHostComponent);
		fixture.detectChanges();
		inputDe = fixture.debugElement.query(By.css('input'));
	});

	afterEach(() => {
		document.body.style.paddingBottom = '';
		document.documentElement.classList.remove('rgv-bottom-padding-active');
	});

	it('removes bottom padding on blur', fakeAsync(() => {
		document.body.style.paddingBottom = '200px';
		document.documentElement.classList.add('rgv-bottom-padding-active');

		inputDe.nativeElement.dispatchEvent(new Event('focus'));
		tick(300);

		inputDe.nativeElement.dispatchEvent(new Event('blur'));
		tick(50);

		expect(document.documentElement.classList.contains('rgv-bottom-padding-active')).toBeFalse();
	}));

	it('removes bottom padding when keyboard hides via viewport change', fakeAsync(() => {
		// Manually put the directive into scrolling state and apply padding
		inputDe.nativeElement.dispatchEvent(new Event('focus'));
		tick(200);

		// Simulate padding having been applied
		document.body.style.paddingBottom = '300px';
		document.documentElement.classList.add('rgv-bottom-padding-active');

		// Simulate keyboard hide
		mockViewport.emit({ height: 800, offsetTop: 0, keyboardHeight: 0, windowInnerHeight: 800 });
		tick(100);

		expect(document.documentElement.classList.contains('rgv-bottom-padding-active')).toBeFalse();
	}));

	it('emits scrollComplete and dropdownReady after scroll window', fakeAsync(() => {
		const directive: FocusScrollDirective = inputDe.injector.get(FocusScrollDirective);
		let scrollCompleteFired = false;
		let dropdownReadyFired = false;
		directive.scrollComplete.subscribe(() => scrollCompleteFired = true);
		directive.dropdownReady.subscribe(() => dropdownReadyFired = true);

		inputDe.nativeElement.dispatchEvent(new Event('focus'));
		tick(1700); // initialDelay (180) + maxScrollWindow (1400) + buffer

		expect(scrollCompleteFired).toBeTrue();
		expect(dropdownReadyFired).toBeTrue();
	}));
});
