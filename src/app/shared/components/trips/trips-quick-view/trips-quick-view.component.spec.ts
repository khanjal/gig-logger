import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsQuickViewComponent } from './trips-quick-view.component';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { ShortAddressPipe } from '@pipes/short-address.pipe';

describe('TripsQuickViewComponent', () => {
  let component: TripsQuickViewComponent;
  let fixture: ComponentFixture<TripsQuickViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TripsQuickViewComponent, NoSecondsPipe, ShortAddressPipe, TruncatePipe],
    providers: []
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
