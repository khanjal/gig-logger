import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShiftFormComponent } from './shift-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { LoggerService } from '@services/logger.service';
import { Router } from '@angular/router';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { ActionEnum } from '@enums/action.enum';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ShiftFormComponent', () => {
  let component: ShiftFormComponent;
  let fixture: ComponentFixture<ShiftFormComponent>;
  let shiftServiceSpy: jasmine.SpyObj<ShiftService>;
  let tripServiceSpy: jasmine.SpyObj<TripService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  const makeShift = (overrides: Partial<IShift> = {}): IShift => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 2,
    date: overrides.date ?? '2024-01-15',
    service: overrides.service ?? 'DoorDash',
    region: overrides.region ?? 'Downtown',
    number: overrides.number ?? 1,
    key: overrides.key ?? '19372-1-DoorDash',
    distance: overrides.distance ?? 25,
    active: overrides.active ?? '3:45',
    finish: overrides.finish ?? '20:30',
    start: overrides.start ?? '17:00',
    time: overrides.time ?? '3:30',
    trips: overrides.trips ?? 10,
    totalActive: overrides.totalActive ?? '3:45',
    totalTime: overrides.totalTime ?? '3:30',
    totalTrips: overrides.totalTrips ?? 10,
    totalDistance: overrides.totalDistance ?? 25,
    totalPay: overrides.totalPay ?? 80,
    totalTips: overrides.totalTips ?? 25,
    totalBonus: overrides.totalBonus ?? 5,
    grandTotal: overrides.grandTotal ?? 110,
    totalCash: overrides.totalCash ?? 0,
    note: overrides.note ?? '',
    action: overrides.action ?? ActionEnum.Saved,
    actionTime: overrides.actionTime ?? Date.now(),
    saved: overrides.saved ?? true,
    amountPerTrip: overrides.amountPerTrip ?? 11,
    amountPerDistance: overrides.amountPerDistance ?? 4.4,
    amountPerTime: overrides.amountPerTime ?? 31.43,
    pay: overrides.pay ?? 80,
    tip: overrides.tip ?? 25,
    bonus: overrides.bonus ?? 5,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 110,
    omit: overrides.omit ?? false
  });

  const makeTrip = (overrides: Partial<ITrip> = {}): ITrip => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 2,
    date: overrides.date ?? '2024-01-15',
    key: overrides.key ?? '19372-1-DoorDash',
    service: overrides.service ?? 'DoorDash',
    startAddress: overrides.startAddress ?? '123 Main St',
    endAddress: overrides.endAddress ?? '456 Oak Ave',
    pay: overrides.pay ?? 8,
    tip: overrides.tip ?? 3,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 11,
    distance: overrides.distance ?? 2.5,
    action: overrides.action ?? ActionEnum.Saved,
    actionTime: overrides.actionTime ?? Date.now(),
    saved: overrides.saved ?? true,
    endUnit: overrides.endUnit ?? '',
    endOdometer: overrides.endOdometer ?? 0,
    exclude: overrides.exclude ?? false,
    dropoffTime: overrides.dropoffTime ?? '',
    duration: overrides.duration ?? '',
    name: overrides.name ?? '',
    note: overrides.note ?? '',
    number: overrides.number ?? 1,
    orderNumber: overrides.orderNumber ?? '',
    pickupTime: overrides.pickupTime ?? '',
    place: overrides.place ?? '',
    region: overrides.region ?? '',
    startOdometer: overrides.startOdometer ?? 0,
    type: overrides.type ?? 'Delivery',
    amountPerDistance: overrides.amountPerDistance ?? 0,
    amountPerTime: overrides.amountPerTime ?? 0
  });

  beforeEach(async () => {
    shiftServiceSpy = jasmine.createSpyObj('ShiftService', [
      'getMaxRowId', 'getByRowId', 'getShiftsByDate', 'getLastShift', 'add', 'update'
    ]);
    tripServiceSpy = jasmine.createSpyObj('TripService', ['query', 'update']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['debug', 'error', 'info']);

    shiftServiceSpy.getMaxRowId.and.returnValue(Promise.resolve(10));
    shiftServiceSpy.getByRowId.and.returnValue(Promise.resolve(undefined));
    shiftServiceSpy.getShiftsByDate.and.returnValue(Promise.resolve([]));
    shiftServiceSpy.getLastShift.and.returnValue(Promise.resolve(undefined));
    tripServiceSpy.query.and.returnValue(Promise.resolve([]));

    await TestBed.configureTestingModule({
      imports: [ShiftFormComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: ShiftService, useValue: shiftServiceSpy },
        { provide: TripService, useValue: tripServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ShiftFormComponent);
    component = fixture.componentInstance;
    
    // Initialize form to default state (ngOnInit creates the form)
    // Individual tests can override by setting rowId and calling ngOnInit again
  });

  async function initializeComponent(rowId: string | null = 'new') {
    component.rowId = rowId;
    await component.ngOnInit();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('initializes form for new shift', async () => {
      component.rowId = 'new';
      const lastShift = makeShift({ service: 'UberEats', region: 'North' });
      shiftServiceSpy.getLastShift.and.returnValue(Promise.resolve(lastShift));

      await component.ngOnInit();

      expect(component.shiftForm.get('service')?.value).toBe('UberEats');
      expect(component.shiftForm.get('region')?.value).toBe('North');
    });

    it('loads existing shift when editing', async () => {
      const shift = makeShift({ 
        rowId: 5, 
        service: 'DoorDash',
        number: 2,
        active: '3:45:00'
      });
      component.rowId = '5';
      shiftServiceSpy.getByRowId.and.returnValue(Promise.resolve(shift));

      await component.ngOnInit();

      expect(component.shift).toBeDefined();
      expect(component.shiftForm.get('service')?.value).toBe('DoorDash');
      expect(component.shiftForm.get('number')?.value).toBe(2);
      expect(component.shiftForm.get('active')?.value).toBe('3:45'); // seconds removed
    });

    it('sets maxRowId from service', async () => {
      component.rowId = 'new';

      await component.ngOnInit();

      expect(shiftServiceSpy.getMaxRowId).toHaveBeenCalled();
      expect(component.maxRowId).toBe(10);
    });

    it('calculates totals for existing shift', async () => {
      const shift = makeShift({ rowId: 5, key: 'test-key' });
      const trips = [
        makeTrip({ key: 'test-key', pay: 8, tip: 3, cash: 1, bonus: 2, distance: 2.5 }),
        makeTrip({ key: 'test-key', pay: 7, tip: 2, cash: 0, bonus: 0, distance: 1.8 })
      ];
      component.rowId = '5';
      shiftServiceSpy.getByRowId.and.returnValue(Promise.resolve(shift));
      tripServiceSpy.query.and.returnValue(Promise.resolve(trips));
      spyOn(component, 'calculateTotals').and.callThrough();

      await component.ngOnInit();

      expect(component.calculateTotals).toHaveBeenCalled();
    });
  });

  describe('updateComputedShiftNumber', () => {
    it('does not update when editing existing shift', async () => {
      await initializeComponent('5');
      component.computedShiftNumber = 3;

      await component.updateComputedShiftNumber();

      expect(component.computedShiftNumber).toBe(3);
    });

    it('sets to 1 when date or service missing', async () => {
      await initializeComponent('new');
      component.shiftForm.patchValue({ date: null, service: '' });

      await component.updateComputedShiftNumber();

      expect(component.computedShiftNumber).toBe(1);
    });

    it('calculates next shift number for service on date', async () => {
      const existingShifts = [
        makeShift({ service: 'DoorDash', number: 1 }),
        makeShift({ service: 'DoorDash', number: 2 }),
        makeShift({ service: 'UberEats', number: 1 })
      ];
      component.rowId = 'new';
      component.shiftForm.patchValue({ 
        date: new Date('2024-01-15'), 
        service: 'DoorDash' 
      });
      shiftServiceSpy.getShiftsByDate.and.returnValue(Promise.resolve(existingShifts));

      await component.updateComputedShiftNumber();

      expect(component.computedShiftNumber).toBe(3); // Next DoorDash shift
    });
  });

  describe('calculateTotals', () => {
    it('sums trip values correctly', async () => {
      const trips = [
        makeTrip({ pay: 8, tip: 3, cash: 1, bonus: 2, distance: 2.5 }),
        makeTrip({ pay: 7, tip: 2, cash: 0, bonus: 0, distance: 1.8 }),
        makeTrip({ pay: 9, tip: 4, cash: 2, bonus: 1, distance: 3.2 })
      ];
      component.shift = makeShift({ key: 'test-key' });
      tripServiceSpy.query.and.returnValue(Promise.resolve(trips));

      await component.calculateTotals();

      expect(component.computedTotals.totalTrips).toBe(3);
      expect(component.computedTotals.totalPay).toBe(24);
      expect(component.computedTotals.totalTips).toBe(9);
      expect(component.computedTotals.totalCash).toBe(3);
      expect(component.computedTotals.totalBonus).toBe(3);
      expect(component.computedTotals.totalDistance).toBe(7.5);
    });

    it('handles empty trips array', async () => {
      component.shift = makeShift({ key: 'test-key' });
      tripServiceSpy.query.and.returnValue(Promise.resolve([]));

      await component.calculateTotals();

      expect(component.computedTotals.totalTrips).toBe(0);
      expect(component.computedTotals.totalPay).toBe(0);
    });
  });

  describe('addShift', () => {
    beforeEach(async () => {
      await initializeComponent('new');
    });

    it('does nothing if form invalid', async () => {
      component.shiftForm.patchValue({ service: '', date: null });

      await component.addShift();

      expect(shiftServiceSpy.add).not.toHaveBeenCalled();
    });

    it('creates shift with correct action', async () => {
      component.maxRowId = 10;
      component.computedShiftNumber = 2;
      component.shiftForm.patchValue({
        date: new Date('2024-01-15'),
        service: 'DoorDash',
        region: 'Downtown',
        active: '3:30',
        omit: false
      });
      shiftServiceSpy.add.and.returnValue(Promise.resolve());
      spyOn(component.parentReload, 'emit');
      spyOn(component, 'formReset');

      await component.addShift();

      expect(shiftServiceSpy.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          rowId: 11,
          action: ActionEnum.Add,
          saved: false,
          service: 'DoorDash'
        })
      );
    });

    it('generates key from date and shift number', async () => {
      // Don't use beforeEach initialization - manually set up for this test
      component.rowId = 'new';
      component.maxRowId = 10;
      component.computedShiftNumber = 2;
      const testDate = new Date('2024-01-15');

      // Initialize form manually without ngOnInit to control values
      component.shiftForm.patchValue({
        date: testDate,
        service: 'DoorDash'
      });
      shiftServiceSpy.getShiftsByDate.and.returnValue(Promise.resolve([
        makeShift({ service: 'DoorDash', date: '2024-01-15', number: 1 })
      ]));
      await component.updateComputedShiftNumber();
      shiftServiceSpy.add.and.returnValue(Promise.resolve());
      spyOn(component.parentReload, 'emit');
      spyOn(component, 'formReset');

      await component.addShift();

      const callArgs = shiftServiceSpy.add.calls.mostRecent().args[0];
      // DateHelper.getDays() returns days since 1900-01-01, which for 2024-01-15 is 45306
      const expectedDays = Math.floor((testDate.getTime() - new Date('1900-01-01').getTime()) / (1000 * 60 * 60 * 24)) + 2;
      expect(callArgs.key).toBe(`${expectedDays}-2-DoorDash`);
    });

    it('emits reload event after add', async () => {
      component.shiftForm.patchValue({
        date: new Date('2024-01-15'),
        service: 'DoorDash'
      });
      shiftServiceSpy.add.and.returnValue(Promise.resolve());
      spyOn(component.parentReload, 'emit');
      spyOn(component, 'formReset');

      await component.addShift();

      expect(component.parentReload.emit).toHaveBeenCalled();
    });

    it('resets form after add', async () => {
      component.shiftForm.patchValue({
        date: new Date('2024-01-15'),
        service: 'DoorDash'
      });
      shiftServiceSpy.add.and.returnValue(Promise.resolve());
      spyOn(component.parentReload, 'emit');
      spyOn(component, 'formReset');

      await component.addShift();

      expect(component.formReset).toHaveBeenCalled();
    });
  });

  describe('editShift', () => {
    beforeEach(async () => {
      await initializeComponent('5');
    });

    it('does nothing if form invalid', async () => {
      component.shiftForm.patchValue({ service: '' });
      component.rowId = '5';

      await component.editShift();

      expect(shiftServiceSpy.update).not.toHaveBeenCalled();
    });

    it('updates shift with new values', async () => {
      const shift = makeShift({ rowId: 5, key: 'old-key' });
      component.shift = shift;
      component.rowId = '5';
      component.shiftForm.patchValue({
        date: new Date('2024-01-20'),
        service: 'UberEats',
        number: 3,
        active: '4:00'
      });
      shiftServiceSpy.update.and.returnValue(Promise.resolve());
      spyOn(component.parentReload, 'emit');

      await component.editShift();

      expect(component.shift.service).toBe('UberEats');
      expect(component.shift.number).toBe(3);
      expect(component.shift.action).toBe(ActionEnum.Update);
    });

    it('updates shift and emits reload', async () => {
      const shift = makeShift({ rowId: 5, key: '19372-1-DoorDash' });
      component.shift = shift;
      component.rowId = '5';
      component.shiftForm.patchValue({
        date: new Date('2024-01-20'),
        service: 'UberEats',
        number: 2
      });
      shiftServiceSpy.update.and.returnValue(Promise.resolve());
      spyOn(component.editModeExit, 'emit');

      await component.editShift();

      expect(shiftServiceSpy.update).toHaveBeenCalled();
      expect(component.editModeExit.emit).toHaveBeenCalled();
    });

    it('emits reload after edit', async () => {
      component.shift = makeShift({ rowId: 5 });
      component.rowId = '5';
      component.shiftForm.patchValue({ service: 'DoorDash' });
      shiftServiceSpy.update.and.returnValue(Promise.resolve());
      spyOn(component.editModeExit, 'emit');

      await component.editShift();

      expect(component.editModeExit.emit).toHaveBeenCalled();
    });
  });

  describe('formReset', () => {
    it('resets form to default values', async () => {
      await initializeComponent('new');
      component.shiftForm.patchValue({
        service: 'DoorDash',
        region: 'Downtown',
        note: 'Test note'
      });

      component.formReset();

      expect(component.shiftForm.get('service')?.value).toBeFalsy();
      expect(component.shiftForm.get('note')?.value).toBeFalsy();
    });
  });



  describe('form validation', () => {
    beforeEach(async () => {
      await initializeComponent('new');
    });

    it('requires date', () => {
      component.shiftForm.patchValue({ date: null });

      expect(component.shiftForm.get('date')?.valid).toBe(false);
    });

    it('requires service', () => {
      component.shiftForm.patchValue({ service: '' });

      expect(component.shiftForm.get('service')?.valid).toBe(false);
    });

    it('validates time format for active field', () => {
      component.shiftForm.patchValue({ active: 'invalid' });

      expect(component.shiftForm.get('active')?.valid).toBe(false);
    });

    it('accepts valid time format', () => {
      component.shiftForm.patchValue({ active: '3:45' });

      expect(component.shiftForm.get('active')?.valid).toBe(true);
    });
  });
});
