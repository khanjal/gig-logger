import { Component, DebugElement } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FocusScrollDirective } from './focus-scroll.directive';
import { ViewportService } from '@services/viewport.service';
import { BehaviorSubject } from 'rxjs';

class MockViewportService {
	private subj = new BehaviorSubject({ height: 500, offsetTop: 0, keyboardHeight: 200, windowInnerHeight: 800 });
	public viewportChange$ = this.subj.asObservable();
	public getSnapshot() {
		return this.subj.getValue();
	}
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

	it('applies and then removes bottom padding when keyboard hides', fakeAsync(() => {
		// ensure initial state
		document.body.style.paddingBottom = '';

		// focus the input
		inputDe.nativeElement.dispatchEvent(new Event('focus'));

		// allow directive timers to run (initialDelay + settle)
		tick(300);

		// padding should be applied
		expect(document.documentElement.classList.contains('rgv-bottom-padding-active')).toBeTrue();
		const appliedPadding = document.body.style.paddingBottom;
		expect(appliedPadding && appliedPadding.length > 0).toBeTrue();

		// simulate keyboard hide (small keyboardHeight)
		mockViewport.emit({ height: 800, offsetTop: 0, keyboardHeight: 0, windowInnerHeight: 800 });
		tick(100);

		// padding should be removed
		expect(document.documentElement.classList.contains('rgv-bottom-padding-active')).toBeFalse();
		expect(document.body.style.paddingBottom === '' || document.body.style.paddingBottom === null).toBeTrue();
	}));
});
