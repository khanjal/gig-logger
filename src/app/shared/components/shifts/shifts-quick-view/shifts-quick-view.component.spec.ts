import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { ShiftsQuickViewComponent } from './shifts-quick-view.component';

describe('ShiftsQuickViewComponent', () => {
  let component: ShiftsQuickViewComponent;
  let fixture: ComponentFixture<ShiftsQuickViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiftsQuickViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftsQuickViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('tags', () => {
    // Tags live in the expanded panel beside Region, so the view has to be opened to see them.
    // Built on a fresh fixture with state set before the first change-detection pass - toggling
    // isExpanded after beforeEach's detectChanges trips NG0100 on the expand button's own title.
    const showShift = (tags: string[] | undefined) => {
      const f = TestBed.createComponent(ShiftsQuickViewComponent);
      f.componentInstance.shift = { region: '', note: '', tags } as unknown as typeof component.shift;
      f.componentInstance.isExpanded = true;
      f.detectChanges();
      return f;
    };

    it('renders each tag on the shift', () => {
      const text = (showShift(['weekend', 'double']).nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('weekend');
      expect(text).toContain('double');
    });

    it('renders nothing when a shift has no tags', () => {
      const chips = (showShift([]).nativeElement as HTMLElement).querySelectorAll('.rounded-full');

      expect(chips.length).toBe(0);
    });

    it('does not break on a shift whose tags are undefined', () => {
      // Locally cached rows written before tags were modelled have no tags property at all.
      expect(() => showShift(undefined)).not.toThrow();
    });
  });
});
