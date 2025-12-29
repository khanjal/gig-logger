import { TestBed } from '@angular/core/testing';
import { TripFormComponent } from './trip-form.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewportScroller } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AddressService } from '@services/sheets/address.service';
import { DeliveryService } from '@services/delivery.service';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { NameService } from '@services/sheets/name.service';
import { PlaceService } from '@services/sheets/place.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/sheets/trip.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IShift } from '@interfaces/shift.interface';
import { DateHelper } from '@helpers/date.helper';

describe('TripFormComponent', () => {
  let component: TripFormComponent;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let viewportScroller: jasmine.SpyObj<ViewportScroller>;
  let shiftService: jasmine.SpyObj<ShiftService>;
  let tripService: jasmine.SpyObj<TripService>;
  let placeService: jasmine.SpyObj<PlaceService>;
  let addressService: jasmine.SpyObj<AddressService>;
  let nameService: jasmine.SpyObj<NameService>;
  let deliveryService: jasmine.SpyObj<DeliveryService>;
  let timerService: jasmine.SpyObj<TimerService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<TripFormComponent>>;

  beforeEach(async () => {
    const snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const vpSpy = jasmine.createSpyObj('ViewportScroller', ['scrollToAnchor']);
    const shiftSpy = jasmine.createSpyObj('ShiftService', ['query', 'getMaxRowId', 'list', 'queryShiftByKey', 'add', 'update', 'getPreviousWeekShifts']);
    const tripSpy = jasmine.createSpyObj('TripService', ['add', 'update', 'list', 'getMaxRowId', 'query']);
    const placeSpy = jasmine.createSpyObj('PlaceService', ['find', 'list']);
    const addressSpy = jasmine.createSpyObj('AddressService', ['find']);
    const nameSpy = jasmine.createSpyObj('NameService', ['find']);
    const deliverySpy = jasmine.createSpyObj('DeliveryService', ['queryRemoteDeliveries']);
    const gigSpy = jasmine.createSpyObj('GigWorkflowService', ['calculateShiftTotals', 'updateAncillaryInfo']);
    const timerSpy = jasmine.createSpyObj('TimerService', ['delay']);
    const dialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [TripFormComponent, HttpClientTestingModule],
      providers: [
        { provide: MatSnackBar, useValue: snackSpy },
        { provide: ViewportScroller, useValue: vpSpy },
        { provide: ShiftService, useValue: shiftSpy },
        { provide: TripService, useValue: tripSpy },
        { provide: PlaceService, useValue: placeSpy },
        { provide: AddressService, useValue: addressSpy },
        { provide: NameService, useValue: nameSpy },
        { provide: DeliveryService, useValue: deliverySpy },
        { provide: GigWorkflowService, useValue: gigSpy },
        { provide: TimerService, useValue: timerSpy },
        { provide: MatDialogRef, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    viewportScroller = TestBed.inject(ViewportScroller) as jasmine.SpyObj<ViewportScroller>;
    shiftService = TestBed.inject(ShiftService) as jasmine.SpyObj<ShiftService>;
    tripService = TestBed.inject(TripService) as jasmine.SpyObj<TripService>;
    placeService = TestBed.inject(PlaceService) as jasmine.SpyObj<PlaceService>;
    addressService = TestBed.inject(AddressService) as jasmine.SpyObj<AddressService>;
    nameService = TestBed.inject(NameService) as jasmine.SpyObj<NameService>;
    deliveryService = TestBed.inject(DeliveryService) as jasmine.SpyObj<DeliveryService>;
    timerService = TestBed.inject(TimerService) as jasmine.SpyObj<TimerService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<TripFormComponent>>;

    const fixture = TestBed.createComponent(TripFormComponent);
    component = fixture.componentInstance;

    // Common spies defaults
    timerService.delay.and.returnValue(Promise.resolve());
    shiftService.getMaxRowId.and.returnValue(Promise.resolve(100));
    tripService.getMaxRowId.and.returnValue(Promise.resolve(200));
    tripService.query.and.returnValue(Promise.resolve([]));
    placeService.list.and.returnValue(Promise.resolve([]));
    tripService.list.and.returnValue(Promise.resolve([]));
    shiftService.getPreviousWeekShifts.and.returnValue(Promise.resolve([]));
    shiftService.queryShiftByKey.and.returnValue(Promise.resolve(undefined));
    shiftService.getMaxRowId.and.returnValue(Promise.resolve(1));

    await component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required validator on service initially', () => {
    const serviceControl = component.tripForm.controls.service;
    serviceControl.setValue('');
    serviceControl.markAsTouched();
    expect(serviceControl.hasError('required')).toBeTrue();
  });

  it('onShiftSelected should remove validator and set region when shift provided', async () => {
    const shift: IShift = { key: '2024-01-01_1', region: 'Downtown', service: 'DoorDash' } as any;
    await component.onShiftSelected(shift);

    expect(component.isNewShift).toBeFalse();
    expect(component.tripForm.controls.region.value).toBe('Downtown');
  });

  it('onShiftSelected should add validator and populate from recent shift when null', async () => {
    const shifts = [
      { key: 'k2', service: 'Uber Eats', region: 'Suburbs' },
      { key: 'k1', service: 'DoorDash', region: 'Downtown' }
    ] as any[];
    shiftService.list.and.returnValue(Promise.resolve(shifts));

    await component.onShiftSelected(null);

    expect(component.isNewShift).toBeTrue();
    expect(component.tripForm.controls.service.value).toBe('DoorDash');
    expect(component.tripForm.controls.region.value).toBe('Downtown');
  });

  it('toggleAdvancedPay should toggle flag and show snack', () => {
    component.toggleAdvancedPay();
    expect(component.showAdvancedPay).toBeTrue();
    expect(snackBar.open).toHaveBeenCalled();
    component.toggleAdvancedPay();
    expect(component.showAdvancedPay).toBeFalse();
  });

  it('toggleOdometer should toggle flag and show snack', () => {
    component.toggleOdometer();
    expect(component.showOdometer).toBeTrue();
    expect(snackBar.open).toHaveBeenCalled();
    component.toggleOdometer();
    expect(component.showOdometer).toBeFalse();
  });

  it('toggleOrder should toggle flag and show snack', () => {
    component.toggleOrder();
    expect(component.showOrder).toBeTrue();
    expect(snackBar.open).toHaveBeenCalled();
    component.toggleOrder();
    expect(component.showOrder).toBeFalse();
  });

  it('togglePickupAddress should toggle flag and show snack', () => {
    component.togglePickupAddress();
    expect(component.showPickupAddress).toBeTrue();
    expect(snackBar.open).toHaveBeenCalled();
    component.togglePickupAddress();
    expect(component.showPickupAddress).toBeFalse();
  });

  it('setPickupAddress should update startAddress', () => {
    component.setPickupAddress('123 Main St');
    expect(component.tripForm.controls.startAddress.value).toBe('123 Main St');
  });

  it('setDropoffAddress should update endAddress', () => {
    component.setDropoffAddress('456 Oak Ave');
    expect(component.tripForm.controls.endAddress.value).toBe('456 Oak Ave');
  });

  it('setPickupTime and setDropoffTime should set times', () => {
    spyOn(DateHelper, 'getTimeString').and.returnValue('10:00');
    component.setPickupTime();
    component.setDropoffTime();
    expect(component.tripForm.controls.pickupTime.value).toBe('10:00');
    expect(component.tripForm.controls.dropoffTime.value).toBe('10:00');
  });

  it('close should emit editModeExit when in edit mode', () => {
    const emitted: any[] = [];
    component.isInEditMode = true;
    component.editModeExit.subscribe(v => emitted.push(v));
    component.close();
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toBeUndefined();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('close should call dialogRef.close when not in edit mode and dialogRef exists', () => {
    component.isInEditMode = false;
    component.close();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('onVoiceResult should update fields and call selectPlace when place provided', async () => {
    const spySelect = spyOn(component, 'selectPlace').and.returnValue(Promise.resolve());
    await component.onVoiceResult({
      service: 'DoorDash',
      pay: 10,
      tip: 2,
      distance: 5,
      type: 'Pickup',
      place: 'Walmart',
      name: 'John Doe',
      bonus: 1,
      cash: 0,
      pickupAddress: '123 Main',
      dropoffAddress: '456 Oak',
      startOdometer: 1000,
      endOdometer: 1010,
      unitNumber: '2B',
      orderNumber: 'AB123'
    });

    expect(component.tripForm.controls.service.value).toBe('DoorDash');
    expect(component.tripForm.controls.place.value).toBe('Walmart');
    expect(spySelect).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalled();
  });
});
