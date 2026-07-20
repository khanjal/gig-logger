import { TestBed } from '@angular/core/testing';
import { DataLoaderService } from './data-loader.service';
import { AddressService } from '../sheets/address.service';
import { DailyService } from '../sheets/daily.service';
import { DeliveryService } from '../sheets/delivery.service';
import { ExpensesService } from '@services/sheets/expenses.service';
import { LocationService } from '../sheets/location.service';
import { MonthlyService } from '../sheets/monthly.service';
import { NameService } from '../sheets/name.service';
import { PlaceService } from '../sheets/place.service';
import { RegionService } from '../sheets/region.service';
import { ServiceService } from '../sheets/service.service';
import { ShiftService } from '../sheets/shift.service';
import { TripService } from '../sheets/trip.service';
import { TypeService } from '../sheets/type.service';
import { WeekdayService } from '../sheets/weekday.service';
import { WeeklyService } from '../sheets/weekly.service';
import { YearlyService } from '../sheets/yearly.service';
import { LoggerService } from '../logger.service';
import type { ISheet } from '@interfaces/sheets/sheet.interface';

describe('DataLoaderService', () => {
  let service: DataLoaderService;
  let mockAddressService: jasmine.SpyObj<AddressService>;
  let mockDailyService: jasmine.SpyObj<DailyService>;
  let mockDeliveryService: jasmine.SpyObj<DeliveryService>;
  let mockExpenseService: jasmine.SpyObj<ExpensesService>;
  let mockLocationService: jasmine.SpyObj<LocationService>;
  let mockMonthlyService: jasmine.SpyObj<MonthlyService>;
  let mockNameService: jasmine.SpyObj<NameService>;
  let mockPlaceService: jasmine.SpyObj<PlaceService>;
  let mockRegionService: jasmine.SpyObj<RegionService>;
  let mockServiceService: jasmine.SpyObj<ServiceService>;
  let mockShiftService: jasmine.SpyObj<ShiftService>;
  let mockTripService: jasmine.SpyObj<TripService>;
  let mockTypeService: jasmine.SpyObj<TypeService>;
  let mockWeekdayService: jasmine.SpyObj<WeekdayService>;
  let mockWeeklyService: jasmine.SpyObj<WeeklyService>;
  let mockYearlyService: jasmine.SpyObj<YearlyService>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  const emptySheet = (): ISheet => ({
    properties: { id: 'sheet-id', name: 'Sheet' },
    addresses: [],
    daily: [],
    deliveries: [],
    expenses: [],
    locations: [],
    monthly: [],
    names: [],
    places: [],
    regions: [],
    services: [],
    setup: [],
    shifts: [],
    trips: [],
    types: [],
    weekdays: [],
    weekly: [],
    yearly: [],
    messages: []
  });

  beforeEach(() => {
    const addressSpy = jasmine.createSpyObj('AddressService', ['load', 'append']);
    const dailySpy = jasmine.createSpyObj('DailyService', ['load']);
    const deliverySpy = jasmine.createSpyObj('DeliveryService', ['load']);
    const expenseSpy = jasmine.createSpyObj('ExpensesService', ['load']);
    const locationSpy = jasmine.createSpyObj('LocationService', ['load']);
    const monthlySpy = jasmine.createSpyObj('MonthlyService', ['load']);
    const nameSpy = jasmine.createSpyObj('NameService', ['load', 'append']);
    const placeSpy = jasmine.createSpyObj('PlaceService', ['load']);
    const regionSpy = jasmine.createSpyObj('RegionService', ['load']);
    const serviceSpy = jasmine.createSpyObj('ServiceService', ['load']);
    const shiftSpy = jasmine.createSpyObj('ShiftService', ['load']);
    const tripSpy = jasmine.createSpyObj('TripService', ['load']);
    const typeSpy = jasmine.createSpyObj('TypeService', ['load']);
    const weekdaySpy = jasmine.createSpyObj('WeekdayService', ['load']);
    const weeklySpy = jasmine.createSpyObj('WeeklyService', ['load']);
    const yearlySpy = jasmine.createSpyObj('YearlyService', ['load']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        DataLoaderService,
        { provide: AddressService, useValue: addressSpy },
        { provide: DailyService, useValue: dailySpy },
        { provide: DeliveryService, useValue: deliverySpy },
        { provide: ExpensesService, useValue: expenseSpy },
        { provide: LocationService, useValue: locationSpy },
        { provide: MonthlyService, useValue: monthlySpy },
        { provide: NameService, useValue: nameSpy },
        { provide: PlaceService, useValue: placeSpy },
        { provide: RegionService, useValue: regionSpy },
        { provide: ServiceService, useValue: serviceSpy },
        { provide: ShiftService, useValue: shiftSpy },
        { provide: TripService, useValue: tripSpy },
        { provide: TypeService, useValue: typeSpy },
        { provide: WeekdayService, useValue: weekdaySpy },
        { provide: WeeklyService, useValue: weeklySpy },
        { provide: YearlyService, useValue: yearlySpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(DataLoaderService);
    mockAddressService = TestBed.inject(AddressService) as jasmine.SpyObj<AddressService>;
    mockDailyService = TestBed.inject(DailyService) as jasmine.SpyObj<DailyService>;
    mockDeliveryService = TestBed.inject(DeliveryService) as jasmine.SpyObj<DeliveryService>;
    mockExpenseService = TestBed.inject(ExpensesService) as jasmine.SpyObj<ExpensesService>;
    mockLocationService = TestBed.inject(LocationService) as jasmine.SpyObj<LocationService>;
    mockMonthlyService = TestBed.inject(MonthlyService) as jasmine.SpyObj<MonthlyService>;
    mockNameService = TestBed.inject(NameService) as jasmine.SpyObj<NameService>;
    mockPlaceService = TestBed.inject(PlaceService) as jasmine.SpyObj<PlaceService>;
    mockRegionService = TestBed.inject(RegionService) as jasmine.SpyObj<RegionService>;
    mockServiceService = TestBed.inject(ServiceService) as jasmine.SpyObj<ServiceService>;
    mockShiftService = TestBed.inject(ShiftService) as jasmine.SpyObj<ShiftService>;
    mockTripService = TestBed.inject(TripService) as jasmine.SpyObj<TripService>;
    mockTypeService = TestBed.inject(TypeService) as jasmine.SpyObj<TypeService>;
    mockWeekdayService = TestBed.inject(WeekdayService) as jasmine.SpyObj<WeekdayService>;
    mockWeeklyService = TestBed.inject(WeeklyService) as jasmine.SpyObj<WeeklyService>;
    mockYearlyService = TestBed.inject(YearlyService) as jasmine.SpyObj<YearlyService>;
    mockLogger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;

    // Set default return values
    mockAddressService.load.and.returnValue(Promise.resolve());
    mockDailyService.load.and.returnValue(Promise.resolve());
    mockDeliveryService.load.and.returnValue(Promise.resolve());
    mockExpenseService.load.and.returnValue(Promise.resolve());
    mockLocationService.load.and.returnValue(Promise.resolve());
    mockMonthlyService.load.and.returnValue(Promise.resolve());
    mockNameService.load.and.returnValue(Promise.resolve());
    mockPlaceService.load.and.returnValue(Promise.resolve());
    mockRegionService.load.and.returnValue(Promise.resolve());
    mockServiceService.load.and.returnValue(Promise.resolve());
    mockShiftService.load.and.returnValue(Promise.resolve());
    mockTripService.load.and.returnValue(Promise.resolve());
    mockTypeService.load.and.returnValue(Promise.resolve());
    mockWeekdayService.load.and.returnValue(Promise.resolve());
    mockWeeklyService.load.and.returnValue(Promise.resolve());
    mockYearlyService.load.and.returnValue(Promise.resolve());
    mockAddressService.append.and.returnValue(Promise.resolve());
    mockNameService.append.and.returnValue(Promise.resolve());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadData', () => {
    it('loads all sheet data in parallel then sequentially loads shifts and trips', async () => {
      await service.loadData(emptySheet());

      expect(mockAddressService.load).toHaveBeenCalledWith([]);
      expect(mockDailyService.load).toHaveBeenCalledWith([]);
      expect(mockExpenseService.load).toHaveBeenCalledWith([]);
      expect(mockShiftService.load).toHaveBeenCalledWith([]);
      expect(mockTripService.load).toHaveBeenCalledWith([]);
    });

    it('loads deliveries and locations directly from the server-computed sheets', async () => {
      await service.loadData(emptySheet());

      expect(mockDeliveryService.load).toHaveBeenCalledWith([]);
      expect(mockLocationService.load).toHaveBeenCalledWith([]);
    });

    it('logs operations', async () => {
      await service.loadData(emptySheet());

      expect(mockLogger.info).toHaveBeenCalledWith('Starting data load process');
      expect(mockLogger.info).toHaveBeenCalledWith('Data loading completed successfully');
    });

    it('logs and rethrows errors', async () => {
      const error = new Error('Load failed');
      mockAddressService.load.and.returnValue(Promise.reject(error));

      await expectAsync(service.loadData(emptySheet())).toBeRejected();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('appendData', () => {
    it('appends addresses and names then reloads deliveries and locations', async () => {
      await service.appendData(emptySheet());

      expect(mockAddressService.append).toHaveBeenCalledWith([]);
      expect(mockNameService.append).toHaveBeenCalledWith([]);
      expect(mockDeliveryService.load).toHaveBeenCalledWith([]);
      expect(mockLocationService.load).toHaveBeenCalledWith([]);
    });

    it('logs append operations', async () => {
      await service.appendData(emptySheet());

      expect(mockLogger.info).toHaveBeenCalledWith('Appending data');
      expect(mockLogger.info).toHaveBeenCalledWith('Data appending completed');
    });

    it('logs and rethrows errors on failure', async () => {
      const error = new Error('Append failed');
      mockAddressService.append.and.returnValue(Promise.reject(error));

      await expectAsync(service.appendData(emptySheet())).toBeRejected();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
