import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { TripsQuickViewComponent } from './trips-quick-view.component';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { Router } from '@angular/router';

describe('TripsQuickViewComponent', () => {
  let component: TripsQuickViewComponent;
  let fixture: ComponentFixture<TripsQuickViewComponent>;
  const mockGig = jasmine.createSpyObj('GigWorkflowService', ['updateTripDuration','calculateShiftTotals']);
  const mockTrip = jasmine.createSpyObj('TripService', ['update','clone','addNext','deleteItem','getByRowId']);
  const mockShift = jasmine.createSpyObj('ShiftService', ['query','queryShiftByKey','update']);
  const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, TripsQuickViewComponent, NoSecondsPipe, ShortAddressPipe, TruncatePipe],
      providers: [
        ...commonTestingProviders,
        { provide: GigWorkflowService, useValue: mockGig },
        { provide: TripService, useValue: mockTrip },
        { provide: ShiftService, useValue: mockShift },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripsQuickViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('computes stripe parity correctly and toggles expansion', () => {
    component.index = 1;
    expect(component.isEvenStripe).toBeFalse();
    component.index = 2;
    expect(component.isEvenStripe).toBeTrue();
    component.stripeEven = true;
    expect(component.isEvenStripe).toBeTrue();

    component.isExpanded = false;
    component.toggleExpansion();
    expect(component.isExpanded).toBeTrue();
  });

  it('navigates on editTrip', async () => {
    component.trip = { rowId: 123 } as any;
    await component.editTrip();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/trips/edit', component.trip.rowId]);
  });

  it('renders action buttons with labels using label input', () => {
    component.trip = { rowId: 1, pickupTime: undefined, dropoffTime: undefined, exclude: false } as any;
    component.showActions = true;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const texts = Array.from(el.querySelectorAll('.app-base-button .btn-text')).map(n => n.textContent?.trim());
    expect(texts).toContain('Edit');
    expect(texts).toContain('Pickup');
  });
});
