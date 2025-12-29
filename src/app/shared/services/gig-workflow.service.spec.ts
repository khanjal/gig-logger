import { TestBed } from '@angular/core/testing';
import { GigWorkflowService } from './gig-workflow.service';
import { ApiService } from './api.service';
import { DataLoaderService } from './data/data-loader.service';
import { DataLinkingService } from './data/data-linking.service';
import { GigCalculatorService } from './calculations/gig-calculator.service';
import { ISheet } from '@interfaces/sheet.interface';
import { ISheetProperties } from '@interfaces/sheet-properties.interface';
import { IShift } from '@interfaces/shift.interface';

describe('GigWorkflowService', () => {
  let service: GigWorkflowService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockDataLoader: jasmine.SpyObj<DataLoaderService>;
  let mockDataLinking: jasmine.SpyObj<DataLinkingService>;
  let mockCalculator: jasmine.SpyObj<GigCalculatorService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'setRefreshToken',
      'clearRefreshToken',
      'refreshAuthToken',
      'createFile',
      'listFiles',
      'getSheetData',
      'getSheetSingle',
      'getSecondarySheetData',
      'saveSheetData',
      'createSheet',
      'warmupLambda',
      'healthCheck',
      'insertDemoData'
    ]);
    const loaderSpy = jasmine.createSpyObj('DataLoaderService', ['loadData', 'appendData']);
    const linkingSpy = jasmine.createSpyObj('DataLinkingService', ['updateAncillaryInfo']);
    const calcSpy = jasmine.createSpyObj('GigCalculatorService', [
      'calculateShiftTotals',
      'calculateDailyTotal',
      'calculateDurationsByKey',
      'updateTripDuration'
    ]);

    TestBed.configureTestingModule({
      providers: [
        GigWorkflowService,
        { provide: ApiService, useValue: apiSpy },
        { provide: DataLoaderService, useValue: loaderSpy },
        { provide: DataLinkingService, useValue: linkingSpy },
        { provide: GigCalculatorService, useValue: calcSpy }
      ]
    });

    service = TestBed.inject(GigWorkflowService);
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockDataLoader = TestBed.inject(DataLoaderService) as jasmine.SpyObj<DataLoaderService>;
    mockDataLinking = TestBed.inject(DataLinkingService) as jasmine.SpyObj<DataLinkingService>;
    mockCalculator = TestBed.inject(GigCalculatorService) as jasmine.SpyObj<GigCalculatorService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Auth Methods', () => {
    it('delegates setRefreshToken to ApiService', async () => {
      mockApiService.setRefreshToken.and.returnValue(Promise.resolve({ accessToken: 'token' } as any));

      await service.setRefreshToken('auth-code');

      expect(mockApiService.setRefreshToken).toHaveBeenCalledWith('auth-code');
    });

    it('delegates clearRefreshToken to ApiService', async () => {
      mockApiService.clearRefreshToken.and.returnValue(Promise.resolve(undefined));

      await service.clearRefreshToken();

      expect(mockApiService.clearRefreshToken).toHaveBeenCalled();
    });

    it('delegates refreshAuthToken to ApiService', async () => {
      mockApiService.refreshAuthToken.and.returnValue(Promise.resolve({ accessToken: 'new-token' } as any));

      await service.refreshAuthToken();

      expect(mockApiService.refreshAuthToken).toHaveBeenCalled();
    });
  });

  describe('File Methods', () => {
    it('delegates createFile to ApiService', async () => {
      const props = { name: 'Test Sheet' } as ISheetProperties;
      mockApiService.createFile.and.returnValue(Promise.resolve(props));

      const result = await service.createFile(props);

      expect(mockApiService.createFile).toHaveBeenCalledWith(props);
      expect(result).toBe(props);
    });

    it('delegates listFiles to ApiService', async () => {
      const files = [{ name: 'Sheet1' }] as ISheetProperties[];
      mockApiService.listFiles.and.returnValue(Promise.resolve(files));

      const result = await service.listFiles();

      expect(mockApiService.listFiles).toHaveBeenCalled();
      expect(result).toBe(files);
    });
  });

  describe('Sheet Methods', () => {
    it('delegates getSheetData to ApiService', async () => {
      const sheetData = { trips: [] } as ISheet;
      mockApiService.getSheetData.and.returnValue(Promise.resolve(sheetData));

      const result = await service.getSheetData('sheet-id-123');

      expect(mockApiService.getSheetData).toHaveBeenCalledWith('sheet-id-123');
      expect(result).toBe(sheetData);
    });

    it('delegates getSheetSingle to ApiService', async () => {
      mockApiService.getSheetSingle.and.returnValue(Promise.resolve([]));

      await service.getSheetSingle('sheet-id', 'Trips');

      expect(mockApiService.getSheetSingle).toHaveBeenCalledWith('sheet-id', 'Trips');
    });

    it('delegates saveSheetData to ApiService', async () => {
      const sheetData = { trips: [] } as ISheet;
      mockApiService.saveSheetData.and.returnValue(Promise.resolve({ success: true }));

      await service.saveSheetData(sheetData);

      expect(mockApiService.saveSheetData).toHaveBeenCalledWith(sheetData);
    });

    it('delegates createSheet to ApiService', async () => {
      mockApiService.createSheet.and.returnValue(Promise.resolve(undefined));

      await service.createSheet('new-sheet-id');

      expect(mockApiService.createSheet).toHaveBeenCalledWith('new-sheet-id');
    });

    it('delegates healthCheck to ApiService', async () => {
      mockApiService.healthCheck.and.returnValue(Promise.resolve({ status: 'ok' }));

      await service.healthCheck('sheet-id');

      expect(mockApiService.healthCheck).toHaveBeenCalledWith('sheet-id');
    });
  });

  describe('Data Methods', () => {
    it('delegates loadData to DataLoaderService', async () => {
      const sheetData = { trips: [] } as ISheet;
      mockDataLoader.loadData.and.returnValue(Promise.resolve());

      await service.loadData(sheetData);

      expect(mockDataLoader.loadData).toHaveBeenCalledWith(sheetData);
    });

    it('delegates appendData to DataLoaderService', async () => {
      const sheetData = { trips: [] } as ISheet;
      mockDataLoader.appendData.and.returnValue(Promise.resolve());

      await service.appendData(sheetData);

      expect(mockDataLoader.appendData).toHaveBeenCalledWith(sheetData);
    });
  });

  describe('Calculation Methods', () => {
    it('delegates calculateShiftTotals to GigCalculatorService', async () => {
      const shifts = [{ id: 1 }] as IShift[];
      mockCalculator.calculateShiftTotals.and.returnValue(Promise.resolve());

      await service.calculateShiftTotals(shifts);

      expect(mockCalculator.calculateShiftTotals).toHaveBeenCalledWith(shifts);
    });

    it('delegates calculateDailyTotal to GigCalculatorService', async () => {
      const dates = ['2024-01-01', '2024-01-02'];
      mockCalculator.calculateDailyTotal.and.returnValue(Promise.resolve());

      await service.calculateDailyTotal(dates);

      expect(mockCalculator.calculateDailyTotal).toHaveBeenCalledWith(dates);
    });

    it('delegates calculateDurationsByKey to GigCalculatorService', async () => {
      mockCalculator.calculateDurationsByKey.and.returnValue(Promise.resolve());

      await service.calculateDurationsByKey('key-123');

      expect(mockCalculator.calculateDurationsByKey).toHaveBeenCalledWith('key-123');
    });

    it('delegates updateTripDuration to GigCalculatorService', async () => {
      const trip = { id: 1 };
      mockCalculator.updateTripDuration.and.returnValue(Promise.resolve());

      await service.updateTripDuration(trip);

      expect(mockCalculator.updateTripDuration).toHaveBeenCalledWith(trip);
    });
  });

  describe('Data Linking Methods', () => {
    it('delegates updateAncillaryInfo to DataLinkingService', async () => {
      mockDataLinking.updateAncillaryInfo.and.returnValue(Promise.resolve());

      await service.updateAncillaryInfo();

      expect(mockDataLinking.updateAncillaryInfo).toHaveBeenCalled();
    });
  });
});
