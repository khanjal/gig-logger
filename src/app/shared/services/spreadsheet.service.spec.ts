import { TestBed } from '@angular/core/testing';
import { SpreadsheetService } from './spreadsheet.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GigWorkflowService } from './gig-workflow.service';
import { LoggerService } from './logger.service';
import { localDB } from '@data/local.db';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { ISheet } from '@interfaces/sheet.interface';

describe('SpreadsheetService', () => {
  let service: SpreadsheetService;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockGigWorkflow: jasmine.SpyObj<GigWorkflowService>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const gigSpy = jasmine.createSpyObj('GigWorkflowService', [
      'healthCheck',
      'getSheetData',
      'loadData',
      'appendData'
    ]);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        SpreadsheetService,
        { provide: MatSnackBar, useValue: snackSpy },
        { provide: GigWorkflowService, useValue: gigSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(SpreadsheetService);
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    mockGigWorkflow = TestBed.inject(GigWorkflowService) as jasmine.SpyObj<GigWorkflowService>;
    mockLogger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  afterEach(async () => {
    await localDB.spreadsheets.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('add', () => {
    it('adds spreadsheet to local database', async () => {
      const spreadsheet: ISpreadsheet = { id: 'sheet-1', name: 'Test', default: false } as ISpreadsheet;

      await service.add(spreadsheet);

      const result = await localDB.spreadsheets.get('sheet-1');
      expect(result?.name).toBe('Test');
    });
  });

  describe('findSheet', () => {
    it('finds spreadsheet by id case-insensitively', async () => {
      await localDB.spreadsheets.add({ id: 'SHEET-ABC', name: 'Test' } as ISpreadsheet);

      const result = await service.findSheet('sheet-abc');

      expect(result?.id).toBe('SHEET-ABC');
    });

    it('returns undefined when sheet not found', async () => {
      const result = await service.findSheet('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getDefaultSheet', () => {
    it('returns the spreadsheet marked as default', async () => {
      await localDB.spreadsheets.bulkAdd([
        { id: 'sheet-1', name: 'Sheet 1', default: false } as ISpreadsheet,
        { id: 'sheet-2', name: 'Default', default: 'true' } as unknown as ISpreadsheet
      ]);

      const result = await service.getDefaultSheet();

      expect(result.name).toBe('Default');
    });
  });

  describe('querySpreadsheets', () => {
    it('queries spreadsheets by field and value', async () => {
      await localDB.spreadsheets.bulkAdd([
        { id: 'sheet-1', name: 'Sheet 1', owner: 'user1' } as ISpreadsheet,
        { id: 'sheet-2', name: 'Sheet 2', owner: 'user1' } as ISpreadsheet,
        { id: 'sheet-3', name: 'Sheet 3', owner: 'user2' } as ISpreadsheet
      ]);

      const result = await service.querySpreadsheets('owner', 'user1');

      expect(result.length).toBe(2);
    });
  });

  describe('getSpreadsheets', () => {
    it('returns all spreadsheets', async () => {
      await localDB.spreadsheets.bulkAdd([
        { id: 'sheet-1', name: 'Sheet 1' } as ISpreadsheet,
        { id: 'sheet-2', name: 'Sheet 2' } as ISpreadsheet
      ]);

      const result = await service.getSpreadsheets();

      expect(result.length).toBe(2);
    });
  });

  describe('update', () => {
    it('updates existing spreadsheet', async () => {
      await localDB.spreadsheets.add({ id: 'sheet-1', name: 'Old Name' } as ISpreadsheet);

      await service.update({ id: 'sheet-1', name: 'New Name' } as ISpreadsheet);

      const result = await localDB.spreadsheets.get('sheet-1');
      expect(result?.name).toBe('New Name');
    });
  });

  describe('deleteSpreadsheet', () => {
    it('deletes spreadsheet by id', async () => {
      await localDB.spreadsheets.add({ id: 'sheet-delete', name: 'Delete Me' } as ISpreadsheet);

      await service.deleteSpreadsheet({ id: 'sheet-delete' } as ISpreadsheet);

      const result = await localDB.spreadsheets.get('sheet-delete');
      expect(result).toBeUndefined();
    });
  });

  describe('warmUpLambda', () => {
    it('calls healthCheck with default sheet id', async () => {
      await localDB.spreadsheets.add({ id: 'default-sheet', default: 'true' } as unknown as ISpreadsheet);
      mockGigWorkflow.healthCheck.and.returnValue(Promise.resolve({ status: 'ok' }));

      await service.warmUpLambda();

      expect(mockGigWorkflow.healthCheck).toHaveBeenCalledWith('default-sheet');
      expect(mockLogger.debug).toHaveBeenCalledWith('Warming up lambda');
    });
  });

  describe('getSpreadsheetData', () => {
    it('fetches sheet data and updates sheet info', async () => {
      const spreadsheet = { id: 'sheet-123', name: 'Test' } as ISpreadsheet;
      const sheetData = { 
        trips: [], 
        properties: { name: 'Updated Name' } 
      } as ISheet;
      
      await localDB.spreadsheets.add(spreadsheet);
      mockGigWorkflow.getSheetData.and.returnValue(Promise.resolve(sheetData));

      const result = await service.getSpreadsheetData(spreadsheet);

      expect(mockGigWorkflow.getSheetData).toHaveBeenCalledWith('sheet-123');
      expect(result).toBe(sheetData);
      
      const updated = await localDB.spreadsheets.get('sheet-123');
      expect(updated?.name).toBe('Updated Name');
    });

    it('returns null when no data received', async () => {
      const spreadsheet = { id: 'sheet-fail' } as ISpreadsheet;
      mockGigWorkflow.getSheetData.and.returnValue(Promise.resolve(null));

      const result = await service.getSpreadsheetData(spreadsheet);

      expect(result).toBeNull();
    });
  });

  describe('loadSpreadsheetData', () => {
    it('shows snackbar notifications and loads data', async () => {
      const sheetData = { trips: [] } as ISheet;
      mockGigWorkflow.loadData.and.returnValue(Promise.resolve());

      await service.loadSpreadsheetData(sheetData);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Loading Primary Spreadsheet Data');
      expect(mockGigWorkflow.loadData).toHaveBeenCalledWith(sheetData);
      expect(mockSnackBar.open).toHaveBeenCalledWith('Loaded Primary Spreadsheet Data');
    });
  });

  describe('appendSpreadsheetData', () => {
    it('shows snackbar notifications and appends data', async () => {
      const sheetData = { trips: [] } as ISheet;
      mockGigWorkflow.appendData.and.returnValue(Promise.resolve());

      await service.appendSpreadsheetData(sheetData);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Loading Secondary Spreadsheet Data');
      expect(mockGigWorkflow.appendData).toHaveBeenCalledWith(sheetData);
      expect(mockSnackBar.open).toHaveBeenCalledWith('Loaded Secondary Spreadsheet Data');
    });
  });
});
