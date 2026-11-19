import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { SheetQuickViewComponent } from './sheet-quick-view.component';
import { TruncatePipe } from '@pipes/truncate.pipe';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';

describe('SheetQuickViewComponent', () => {
  let component: SheetQuickViewComponent;
  let fixture: ComponentFixture<SheetQuickViewComponent>;

  function makeSpreadsheet(overrides: Partial<ISpreadsheet> = {}): ISpreadsheet {
    return { id: 'sheet-1', name: 'Sheet One', default: 'true', size: 1000, ...overrides } as ISpreadsheet;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SheetQuickViewComponent, TruncatePipe],
      providers: [...commonTestingProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetQuickViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('spreadsheet', makeSpreadsheet());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('recomputes the size when the spreadsheet input changes', () => {
    // The setup page tracks this list by id, so a refreshed list reuses this component instance and
    // only swaps the input - ngOnInit does not run again. Size has to follow the input, or a sheet
    // linked before its data was fetched keeps rendering the 0 it started with.
    fixture.componentRef.setInput('spreadsheet', makeSpreadsheet({ size: 0 }));
    fixture.detectChanges();
    const initial = component.size();

    fixture.componentRef.setInput('spreadsheet', makeSpreadsheet({ size: 2048 }));
    fixture.detectChanges();

    expect(component.size()).not.toBe(initial);
    expect(fixture.nativeElement.textContent).toContain(component.size());
  });

  it('shows the source label once the source arrives', () => {
    fixture.componentRef.setInput('spreadsheet', makeSpreadsheet({ source: undefined }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Unknown');

    fixture.componentRef.setInput('spreadsheet', makeSpreadsheet({ source: 'lambda' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Unknown');
  });
});
