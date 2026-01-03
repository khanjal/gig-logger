import { TestBed } from '@angular/core/testing';
import { DataLoaderService } from './data-loader.service';
import { AddressService } from '../sheets/address.service';
import { DailyService } from '../sheets/daily.service';
import { DeliveryService } from '../delivery.service';
import { ExpensesService } from '@services/sheets/expenses.service';
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
import { DataLinkingService } from './data-linking.service';
import { LoggerService } from '../logger.service';
import { ISheet } from '@interfaces/sheet.interface';

describe('DataLoaderService', () => {
  let service: DataLoaderService;
  let mockAddressService: jasmine.SpyObj<AddressService>;
  let mockDailyService: jasmine.SpyObj<DailyService>;
  let mockDeliveryService: jasmine.SpyObj<DeliveryService>;
  let mockExpenseService: jasmine.SpyObj<ExpensesService>;
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
  let mockDataLinking: jasmine.SpyObj<DataLinkingService>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const addressSpy = jasmine.createSpyObj('AddressService', ['load', 'append']);
    const dailySpy = jasmine.createSpyObj('DailyService', ['load']);
    const deliverySpy = jasmine.createSpyObj('DeliveryService', ['clear']);
    const expenseSpy = jasmine.createSpyObj('ExpensesService', ['load']);
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
    const linkingSpy = jasmine.createSpyObj('DataLinkingService', ['linkAllData', 'linkDeliveries']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        DataLoaderService,
        { provide: AddressService, useValue: addressSpy },
        { provide: DailyService, useValue: dailySpy },
        { provide: DeliveryService, useValue: deliverySpy },
        { provide: ExpensesService, useValue: expenseSpy },
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
        { provide: DataLinkingService, useValue: linkingSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(DataLoaderService);
    mockAddressService = TestBed.inject(AddressService) as jasmine.SpyObj<AddressService>;
    mockDailyService = TestBed.inject(DailyService) as jasmine.SpyObj<DailyService>;
    mockDeliveryService = TestBed.inject(DeliveryService) as jasmine.SpyObj<DeliveryService>;
    mockExpenseService = TestBed.inject(ExpensesService) as jasmine.SpyObj<ExpensesService>;
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
    mockDataLinking = TestBed.inject(DataLinkingService) as jasmine.SpyObj<DataLinkingService>;
    mockLogger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;

    // Set default return values
    mockAddressService.load.and.returnValue(Promise.resolve());
    mockDailyService.load.and.returnValue(Promise.resolve());
    mockExpenseService.load.and.returnValue(Promise.resolve());
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
    mockDeliveryService.clear.and.returnValue(Promise.resolve());
    mockDataLinking.linkAllData.and.returnValue(Promise.resolve());
    mockDataLinking.linkDeliveries.and.returnValue(Promise.resolve());
    mockAddressService.append.and.returnValue(Promise.resolve());
    mockNameService.append.and.returnValue(Promise.resolve());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadData', () => {
    it('loads all sheet data in parallel then sequentially loads shifts and trips', async () => {
      const sheetData: ISheet = {
        properties: { id: 'sheet-id', name: 'Sheet' },
        addresses: [],
        daily: [],
        expenses: [],
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
      };

      await service.loadData(sheetData);

      expect(mockAddressService.load).toHaveBeenCalledWith([]);
      expect(mockDailyService.load).toHaveBeenCalledWith([]);
      expect(mockExpenseService.load).toHaveBeenCalledWith([]);
      expect(mockShiftService.load).toHaveBeenCalledWith([]);
      expect(mockTripService.load).toHaveBeenCalledWith([]);
    });

    it('links all data after loading', async () => {
      const sheetData: ISheet = {
        properties: { id: 'sheet-id', name: 'Sheet' },
        addresses: [],
        daily: [],
        expenses: [],
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
      };

      await service.loadData(sheetData);

      expect(mockDataLinking.linkAllData).toHaveBeenCalled();
      expect(mockDataLinking.linkDeliveries).toHaveBeenCalled();
    });

    it('clears deliveries before linking', async () => {
      const sheetData: ISheet = {
        properties: { id: 'sheet-id', name: 'Sheet' },
        addresses: [],
        daily: [],
        expenses: [],
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
      };

      await service.loadData(sheetData);

      expect(mockDeliveryService.clear).toHaveBeenCalled();
      expect(mockDataLinking.linkDeliveries).toHaveBeenCalledWith([]);
    });

    it('logs operations', async () => {
      const sheetData = {} as ISheet;

      await service.loadData(sheetData);

      expect(mockLogger.info).toHaveBeenCalledWith('Starting data load process');
      expect(mockLogger.info).toHaveBeenCalledWith('Linking data');
      expect(mockLogger.info).toHaveBeenCalledWith('Data loading completed successfully');
    });

    it('logs and rethrows errors', async () => {
      const sheetData: ISheet = {
        properties: { id: 'sheet-id', name: 'Sheet' },
        addresses: [], daily: [], expenses: [], monthly: [], names: [], places: [], regions: [], services: [], setup: [], shifts: [], trips: [], types: [], weekdays: [], weekly: [], yearly: [], messages: []
      };
      const error = new Error('Load failed');
      mockAddressService.load.and.returnValue(Promise.reject(error));

      await expectAsync(service.loadData(sheetData)).toBeRejected();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('appendData', () => {
    it('appends addresses and names then links deliveries', async () => {
      const sheetData: ISheet = {
        properties: { id: 'sheet-id', name: 'Sheet' },
        addresses: [], daily: [], expenses: [], monthly: [], names: [], places: [], regions: [], services: [], setup: [], shifts: [], trips: [], types: [], weekdays: [], weekly: [], yearly: [], messages: []
      };

      await service.appendData(sheetData);

      expect(mockAddressService.append).toHaveBeenCalledWith([]);
      expect(mockNameService.append).toHaveBeenCalledWith([]);
      expect(mockDataLinking.linkDeliveries).toHaveBeenCalledWith([]);
    });

    it('logs append operations', async () => {
      const sheetData: ISheet = {
        properties: { id: 'sheet-id', name: 'Sheet' },
        addresses: [], daily: [], expenses: [], monthly: [], names: [], places: [], regions: [], services: [], setup: [], shifts: [], trips: [], types: [], weekdays: [], weekly: [], yearly: [], messages: []
      };

      await service.appendData(sheetData);

      expect(mockLogger.info).toHaveBeenCalledWith('Appending data');
      expect(mockLogger.info).toHaveBeenCalledWith('Data appending completed');
    });

    it('logs and rethrows errors on failure', async () => {
      const sheetData: ISheet = {
        properties: { id: 'sheet-id', name: 'Sheet' },
        addresses: [], daily: [], expenses: [], monthly: [], names: [], places: [], regions: [], services: [], setup: [], shifts: [], trips: [], types: [], weekdays: [], weekly: [], yearly: [], messages: []
      };
      const error = new Error('Append failed');
      mockAddressService.append.and.returnValue(Promise.reject(error));

      await expectAsync(service.appendData(sheetData)).toBeRejected();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
