import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { SheetLinkComponent } from './sheet-link.component';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from '@services/logger.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

describe('SheetLinkComponent', () => {
  let component: SheetLinkComponent;
  let fixture: ComponentFixture<SheetLinkComponent>;

  let spreadsheetSpy: jasmine.SpyObj<SpreadsheetService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    spreadsheetSpy = jasmine.createSpyObj('SpreadsheetService', ['findSheet', 'add']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SheetLinkComponent],
      providers: [
        ...commonTestingProviders,
        { provide: SpreadsheetService, useValue: spreadsheetSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('openCreateSheetDialog - success should link sheet and emit', async () => {
    const dialogResult = { id: 's1', name: 'Sheet 1' } as any;
    dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
    spreadsheetSpy.findSheet.and.returnValue(Promise.resolve(undefined));
    spreadsheetSpy.add.and.returnValue(Promise.resolve());

    spyOn(component.parentReload, 'emit');

    component.openCreateSheetDialog();

    // wait for promises to resolve
    await Promise.resolve();
    await Promise.resolve();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(spreadsheetSpy.add).toHaveBeenCalledWith(jasmine.objectContaining({ id: 's1' }));
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.parentReload.emit).toHaveBeenCalled();
  });

  it('openCreateSheetDialog - failure should log and show error snackbar', async () => {
    const dialogResult = { error: 'boom' } as any;
    dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as any);

    component.openCreateSheetDialog();

    await Promise.resolve();

    expect(loggerSpy.error).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('linkSheet - when sheet exists should show already linked snackbar', async () => {
    const sheet = { properties: { id: 's2', name: 'Existing' } } as any;
    spreadsheetSpy.findSheet.and.returnValue(Promise.resolve({ id: 's2' } as any));

    spyOn(component.parentReload, 'emit');

    component.linkSheet(sheet);

    await Promise.resolve();

    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(spreadsheetSpy.add).not.toHaveBeenCalled();
    expect(component.parentReload.emit).not.toHaveBeenCalled();
  });

  it('linkSheet - add failure should log and show error snackbar', async () => {
    const sheet = { properties: { id: 's3', name: 'New' } } as any;
    spreadsheetSpy.findSheet.and.returnValue(Promise.resolve(undefined));
    spreadsheetSpy.add.and.returnValue(Promise.reject(new Error('fail')));

    spyOn(component.parentReload, 'emit');

    component.linkSheet(sheet);

    // wait for microtasks
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(loggerSpy.error).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.parentReload.emit).not.toHaveBeenCalled();
  });

  it('openListSheetsDialog - success should link selected sheet', async () => {
    const dialogResult = { id: 'l1', name: 'List Item' } as any;
    dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
    spreadsheetSpy.findSheet.and.returnValue(Promise.resolve(undefined));
    spreadsheetSpy.add.and.returnValue(Promise.resolve());

    spyOn(component.parentReload, 'emit');

    component.openListSheetsDialog();

    // allow promise microtasks
    await Promise.resolve();
    await Promise.resolve();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(spreadsheetSpy.add).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'l1' }));
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.parentReload.emit).toHaveBeenCalled();
  });

  it('openListSheetsDialog - canceled should not link', async () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    spyOn(component.parentReload, 'emit');

    component.openListSheetsDialog();

    await Promise.resolve();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(spreadsheetSpy.add).not.toHaveBeenCalled();
    expect(component.parentReload.emit).not.toHaveBeenCalled();
  });
});
