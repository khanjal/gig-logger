import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { TripsQuickViewComponent } from './trips-quick-view.component';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { Router } from '@angular/router';
import type { MatDialog } from '@angular/material/dialog';
import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IShift } from '@interfaces/entities/shift.interface';

describe('TripsQuickViewComponent', () => {
  let component: TripsQuickViewComponent;
  let fixture: ComponentFixture<TripsQuickViewComponent>;
  const mockGig = jasmine.createSpyObj('GigWorkflowService', ['updateTripDuration', 'calculateShiftTotals', 'calculateShiftTotalsByKey']);
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
  });

  it('should create', () => {
    fixture.detectChanges();
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
    component.trip = { rowId: 123 } as unknown as ITrip;
    fixture.detectChanges();
    await component.editTrip();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/trips/edit', component.trip.rowId]);
  });

  it('renders action buttons with labels using label input', () => {
    component.trip = { rowId: 1, pickupTime: undefined, dropoffTime: undefined, exclude: false } as unknown as ITrip;
    component.showActions = true;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const texts = Array.from(el.querySelectorAll('.app-base-button .btn-text')).map(n => n.textContent?.trim());
    expect(texts).toContain('Edit');
    expect(texts).toContain('Pickup');
  });

  describe('confirmDeleteTripDialog', () => {
    it('deletes the trip and recalculates shift totals when confirmed', async () => {
      component.trip = { rowId: 1, key: 'trip-key' } as unknown as ITrip;
      mockTrip.deleteItem.and.returnValue(Promise.resolve());
      mockGig.calculateShiftTotalsByKey.and.returnValue(Promise.resolve());
      spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as unknown as ReturnType<MatDialog['open']>);
      const reloadSpy = spyOn(component.parentReload, 'emit');

      component.confirmDeleteTripDialog();
      // afterClosed().subscribe(async ...) resolves on the microtask queue.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(component.dialog.open).toHaveBeenCalled();
      expect(mockTrip.deleteItem).toHaveBeenCalledWith(component.trip);
      expect(mockGig.calculateShiftTotalsByKey).toHaveBeenCalledWith('trip-key');
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('does not delete when the user cancels', () => {
      component.trip = { rowId: 1, key: 'trip-key' } as unknown as ITrip;
      mockTrip.deleteItem.calls.reset();
      spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(false) } as unknown as ReturnType<MatDialog['open']>);

      component.confirmDeleteTripDialog();

      expect(mockTrip.deleteItem).not.toHaveBeenCalled();
    });
  });

  describe('setDropoffTime', () => {
    it('updates the matching shift finish time and the trip dropoff time', async () => {
      component.trip = { rowId: 1, key: 'trip-key' } as unknown as ITrip;
      const shift = { id: 1, key: 'trip-key' } as unknown as IShift;
      mockShift.query.and.returnValue(Promise.resolve([shift]));
      mockShift.update.and.returnValue(Promise.resolve());
      mockGig.updateTripDuration.and.returnValue(Promise.resolve());
      const reloadSpy = spyOn(component.parentReload, 'emit');
      const scrollSpy = spyOn(component.scrollToTrip, 'emit');

      await component.setDropoffTime();

      expect(mockShift.query).toHaveBeenCalledWith('key', 'trip-key');
      expect(mockShift.update).toHaveBeenCalledWith([shift]);
      expect(component.trip.dropoffTime).toBeTruthy();
      expect(mockGig.updateTripDuration).toHaveBeenCalledWith(component.trip);
      expect(scrollSpy).toHaveBeenCalledWith('1');
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('skips the shift update when no matching shift is found', async () => {
      component.trip = { rowId: 2, key: 'no-shift' } as unknown as ITrip;
      mockShift.query.and.returnValue(Promise.resolve([]));
      mockShift.update.calls.reset();
      mockGig.updateTripDuration.and.returnValue(Promise.resolve());

      await component.setDropoffTime();

      expect(mockShift.update).not.toHaveBeenCalled();
      expect(component.trip.dropoffTime).toBeTruthy();
    });
  });

  describe('setPickupTime', () => {
    it('updates the matching shift finish time and the trip pickup time', async () => {
      component.trip = { rowId: 1, key: 'trip-key' } as unknown as ITrip;
      const shift = { id: 1, key: 'trip-key' } as unknown as IShift;
      mockShift.query.and.returnValue(Promise.resolve([shift]));
      mockShift.update.and.returnValue(Promise.resolve());
      mockTrip.update.and.returnValue(Promise.resolve());

      await component.setPickupTime();

      expect(mockShift.query).toHaveBeenCalledWith('key', 'trip-key');
      expect(mockShift.update).toHaveBeenCalledWith([shift]);
      expect(component.trip.pickupTime).toBeTruthy();
      expect(mockTrip.update).toHaveBeenCalledWith([component.trip]);
    });
  });
});
