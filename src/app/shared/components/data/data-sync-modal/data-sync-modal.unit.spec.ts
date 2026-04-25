import { of } from 'rxjs';
import { DateHelper } from '@helpers/date.helper';
import { DataSyncModalComponent } from './data-sync-modal.component';

describe('DataSyncModalComponent (lightunit)', () => {
  let component: DataSyncModalComponent;
  let dialogRef: any;
  let mockSheetService: any;
  let mockGigService: any;
  let mockUnsaved: any;
  let mockTimer: any;
  let mockLogger: any;

  beforeEach(() => {
    dialogRef = { close: jasmine.createSpy('close') };

    mockSheetService = {
      getDefaultSheet: jasmine.createSpy('getDefaultSheet').and.returnValue(Promise.resolve({ id: 's1' })),
      warmUpLambda: jasmine.createSpy('warmUpLambda').and.returnValue(Promise.resolve(true)),
      getSpreadsheetData: jasmine.createSpy('getSpreadsheetData').and.returnValue(Promise.resolve({ messages: [] })),
      getSpreadsheets: jasmine.createSpy('getSpreadsheets').and.returnValue(Promise.resolve([])),
      loadSpreadsheetData: jasmine.createSpy('loadSpreadsheetData').and.returnValue(Promise.resolve())
    };

    mockGigService = {
      calculateShiftTotals: jasmine.createSpy('calculateShiftTotals').and.returnValue(Promise.resolve()),
      saveSheetData: jasmine.createSpy('saveSheetData').and.returnValue(Promise.resolve([])),
      createFile: jasmine.createSpy('createFile').and.returnValue(Promise.resolve({ id: 'new-id', name: 'file' })),
      createSheet: jasmine.createSpy('createSheet').and.returnValue(Promise.resolve()),
      insertDemoData: jasmine.createSpy('insertDemoData').and.returnValue(Promise.resolve())
    };

    mockUnsaved = {
      collectUnsavedItems: jasmine.createSpy('collectUnsavedItems').and.returnValue(Promise.resolve({ unsavedTrips: [], unsavedShifts: [], unsavedExpenses: [] })),
      commitSavedItems: jasmine.createSpy('commitSavedItems').and.returnValue(Promise.resolve())
    };

    mockTimer = { delay: jasmine.createSpy('delay').and.returnValue(Promise.resolve()) };

    mockLogger = { onLog: of(), error: jasmine.createSpy('error') };

    // stable time formatting
    spyOn(DateHelper, 'getMinutesAndSeconds').and.returnValue('00:00');

    component = new DataSyncModalComponent(
      'save',
      dialogRef,
      mockGigService,
      mockSheetService,
      mockUnsaved,
      mockTimer,
      mockLogger
    );
  });

  it('syncStatusLabel returns saved for save type', () => {
    component = new DataSyncModalComponent('save' as any, dialogRef, mockGigService, mockSheetService, mockUnsaved, mockTimer, mockLogger);
    expect(component.syncStatusLabel).toBe('saved');
  });

  it('appendToTerminal and appendToLastMessage update terminalMessages', () => {
    (component as any).appendToTerminal('first');
    expect(component.terminalMessages().length).toBe(1);
    (component as any).appendToLastMessage(' appended');
    expect(component.terminalMessages()[0].text).toContain('first');
    expect(component.terminalMessages()[0].text).toContain('appended');
  });

  it('cancelSync closes dialog with false', () => {
    component.cancelSync();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('continueLoad with no data appends error message', async () => {
    // ensure data is null
    (component as any).data = null;
    await component.continueLoad();
    expect(component.terminalMessages().some(m => m.text.includes('No data to continue with'))).toBeTrue();
  });

  it('processFailure sets error type and respects autoCloseOnError when true', async () => {
    // set autoCloseOnError true via constructor config
    component = new DataSyncModalComponent({ type: 'save', autoCloseOnError: true } as any, dialogRef, mockGigService, mockSheetService, mockUnsaved, mockTimer, mockLogger);
    await (component as any).warmup(0); // ensure timer started then stopped internally
    await (component as any).processFailure('ERROR');
    expect(component.terminalMessages().some(m => /auto-close/i.test(m.text))).toBeTrue();
    // use any-cast to access protected syncState for assertion
    expect((component as any).syncState().isAutoClose).toBeTrue();
  });
});
