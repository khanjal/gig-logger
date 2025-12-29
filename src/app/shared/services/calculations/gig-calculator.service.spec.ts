import { TestBed } from '@angular/core/testing';
import { GigCalculatorService } from './gig-calculator.service';
import { ShiftService } from '../sheets/shift.service';
import { TripService } from '../sheets/trip.service';
import { WeekdayService } from '../sheets/weekday.service';
import { LoggerService } from '../logger.service';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { IWeekday } from '@interfaces/weekday.interface';

describe('GigCalculatorService', () => {
  let service: GigCalculatorService;
  let shiftService: jasmine.SpyObj<ShiftService>;
  let tripService: jasmine.SpyObj<TripService>;
  let weekdayService: jasmine.SpyObj<WeekdayService>;
  let loggerService: jasmine.SpyObj<LoggerService>;

  const makeTrip = (overrides: Partial<ITrip> = {}): ITrip => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
    action: overrides.action ?? '',
    actionTime: overrides.actionTime ?? 0,
    key: overrides.key ?? 'k1',
    date: overrides.date ?? '2024-01-01',
    distance: overrides.distance ?? 0,
    endAddress: overrides.endAddress ?? '',
    endUnit: overrides.endUnit ?? '',
    endOdometer: overrides.endOdometer ?? 0,
    exclude: overrides.exclude ?? false,
    dropoffTime: overrides.dropoffTime ?? '10:30',
    duration: overrides.duration ?? '00:30:00',
    name: overrides.name ?? '',
    note: overrides.note ?? '',
    number: overrides.number ?? 1,
    orderNumber: overrides.orderNumber ?? '',
    pickupTime: overrides.pickupTime ?? '10:00',
    place: overrides.place ?? '',
    region: overrides.region ?? '',
    service: overrides.service ?? '',
    startAddress: overrides.startAddress ?? '',
    startOdometer: overrides.startOdometer ?? 0,
    type: overrides.type ?? '',
    amountPerDistance: overrides.amountPerDistance ?? 0,
    amountPerTime: overrides.amountPerTime ?? 0,
    pay: overrides.pay ?? 10,
    tip: overrides.tip ?? 2,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 12,
  });

  const makeShift = (overrides: Partial<IShift> = {}): IShift => ({
    key: overrides.key ?? 'k1',
    date: overrides.date ?? '2024-01-01',
    region: overrides.region ?? 'Downtown',
    service: overrides.service ?? 'DoorDash',
    start: overrides.start ?? '',
    finish: overrides.finish ?? '',
    time: overrides.time ?? '',
    active: overrides.active ?? '',
    totalActive: overrides.totalActive ?? '',
    totalTime: overrides.totalTime ?? '',
    trips: overrides.trips ?? 0,
    totalTrips: overrides.totalTrips ?? 0,
    distance: overrides.distance ?? 0,
    totalDistance: overrides.totalDistance ?? 0,
    pay: overrides.pay ?? 0,
    totalPay: overrides.totalPay ?? 0,
    tip: overrides.tip ?? 0,
    totalTips: overrides.totalTips ?? 0,
    bonus: overrides.bonus ?? 0,
    totalBonus: overrides.totalBonus ?? 0,
    cash: overrides.cash ?? 0,
    totalCash: overrides.totalCash ?? 0,
    grandTotal: overrides.grandTotal ?? 0,
    amountPerTime: overrides.amountPerTime ?? 0,
  } as IShift);

  beforeEach(() => {
    const shiftSpy = jasmine.createSpyObj('ShiftService', [
      'getPreviousWeekShifts',
      'queryShiftByKey',
      'update',
      'query',
      'getShiftsByStartDate',
      'getShiftsByDate'
    ]);
    const tripSpy = jasmine.createSpyObj('TripService', ['query', 'update']);
    const weekdaySpy = jasmine.createSpyObj('WeekdayService', ['query', 'update']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug']);

    TestBed.configureTestingModule({
      providers: [
        GigCalculatorService,
        { provide: ShiftService, useValue: shiftSpy },
        { provide: TripService, useValue: tripSpy },
        { provide: WeekdayService, useValue: weekdaySpy },
        { provide: LoggerService, useValue: loggerSpy },
      ],
    });

    service = TestBed.inject(GigCalculatorService);
    shiftService = TestBed.inject(ShiftService) as jasmine.SpyObj<ShiftService>;
    tripService = TestBed.inject(TripService) as jasmine.SpyObj<TripService>;
    weekdayService = TestBed.inject(WeekdayService) as jasmine.SpyObj<WeekdayService>;
    loggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sums trip fields correctly', () => {
    const trips = [
      makeTrip({ pay: 10, tip: 2 }),
      makeTrip({ pay: 15, tip: 3 }),
    ];

    const totalPay = (service as any).sumTripField(trips, 'pay');
    const totalTip = (service as any).sumTripField(trips, 'tip');

    expect(totalPay).toBe(25);
    expect(totalTip).toBe(5);
  });

  it('calculates shift durations with trip times', () => {
    const shift = makeShift({ key: 'k1' });
    const trips = [
      makeTrip({ pickupTime: '10:00', dropoffTime: '10:30', duration: '00:30:00' }),
      makeTrip({ pickupTime: '11:00', dropoffTime: '11:20', duration: '00:20:00' }),
    ];

    const result = service.calculateDurations(shift, trips);

    expect(result.start).toBe('10:00');
    expect(result.finish).toBe('11:20');
    expect(result.time).toBeTruthy();
  });

  it('calculates shift totals for provided shifts', async () => {
    const shift = makeShift({ key: 'k1', pay: 0, tip: 0, bonus: 0 });
    const trips = [
      makeTrip({ key: 'k1', pay: 10, tip: 2, bonus: 1, cash: 0, total: 13, distance: 5 }),
      makeTrip({ key: 'k1', pay: 15, tip: 3, bonus: 0, cash: 1, total: 19, distance: 3 }),
    ];

    tripService.query.and.returnValue(Promise.resolve(trips));
    shiftService.update.and.returnValue(Promise.resolve());
    weekdayService.query.and.returnValue(Promise.resolve([]));
    weekdayService.update.and.returnValue(Promise.resolve());

    await service.calculateShiftTotals([shift]);

    expect(shiftService.update).toHaveBeenCalled();
    const updatedShift = (shiftService.update.calls.mostRecent().args[0] as IShift[])[0];
    expect(updatedShift.totalPay).toBe(25);
    expect(updatedShift.totalTips).toBe(5);
    expect(updatedShift.totalDistance).toBe(8);
  });

  it('fetches previous week shifts when none provided', async () => {
    const shifts = [makeShift()];
    shiftService.getPreviousWeekShifts.and.returnValue(Promise.resolve(shifts));
    tripService.query.and.returnValue(Promise.resolve([]));
    shiftService.update.and.returnValue(Promise.resolve());
    weekdayService.query.and.returnValue(Promise.resolve([]));
    weekdayService.update.and.returnValue(Promise.resolve());

    await service.calculateShiftTotals();

    expect(shiftService.getPreviousWeekShifts).toHaveBeenCalled();
  });

  it('updates trip duration and recalculates shift', async () => {
    const trip = makeTrip({ pickupTime: '10:00', dropoffTime: '10:45', key: 'k1' });
    const shift = makeShift({ key: 'k1' });
    const trips = [trip];

    tripService.update.and.returnValue(Promise.resolve());
    shiftService.queryShiftByKey.and.returnValue(Promise.resolve(shift));
    tripService.query.and.returnValue(Promise.resolve(trips));
    shiftService.update.and.returnValue(Promise.resolve());

    await service.updateTripDuration(trip);

    expect(tripService.update).toHaveBeenCalled();
    expect(shiftService.queryShiftByKey).toHaveBeenCalledWith('k1');
  });

  it('updates weekday current amount in daily calculation', async () => {
    const shifts = [makeShift({ date: '2024-01-01', grandTotal: 50 })];
    const weekday: IWeekday = { day: 'Monday', currentAmount: 0 } as IWeekday;

    shiftService.getShiftsByDate.and.returnValue(Promise.resolve(shifts));
    weekdayService.query.and.returnValue(Promise.resolve([weekday]));
    weekdayService.update.and.returnValue(Promise.resolve());

    await service.calculateDailyTotal(['2024-01-01']);

    expect(weekdayService.update).toHaveBeenCalled();
  });
});
