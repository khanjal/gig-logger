import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '../../../../test-harness';
import { SheetQuickViewComponent } from './sheet-quick-view.component';
import { TruncatePipe } from '@pipes/truncate.pipe';

describe('SheetQuickViewComponent', () => {
  let component: SheetQuickViewComponent;
  let fixture: ComponentFixture<SheetQuickViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SheetQuickViewComponent, TruncatePipe],
      providers: [...commonTestingProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetQuickViewComponent);
    component = fixture.componentInstance;
    component.spreadsheet = { size: 1000 } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
