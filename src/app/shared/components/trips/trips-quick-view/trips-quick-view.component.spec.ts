import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { TripsQuickViewComponent } from './trips-quick-view.component';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { ShortAddressPipe } from '@pipes/short-address.pipe';

describe('TripsQuickViewComponent', () => {
  let component: TripsQuickViewComponent;
  let fixture: ComponentFixture<TripsQuickViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, TripsQuickViewComponent, NoSecondsPipe, ShortAddressPipe, TruncatePipe],
      providers: [...commonTestingProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripsQuickViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
