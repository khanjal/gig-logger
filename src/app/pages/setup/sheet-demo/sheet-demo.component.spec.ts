import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { SheetDemoComponent } from './sheet-demo.component';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from '@services/logger.service';

describe('SheetDemoComponent', () => {
  let component: SheetDemoComponent;
  let fixture: ComponentFixture<SheetDemoComponent>;

  let gigWorkflowSpy: jasmine.SpyObj<GigWorkflowService>;
  let spreadsheetSpy: jasmine.SpyObj<SpreadsheetService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    gigWorkflowSpy = jasmine.createSpyObj('GigWorkflowService', ['createFile', 'createSheet', 'insertDemoData']);
    spreadsheetSpy = jasmine.createSpyObj('SpreadsheetService', ['add']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error']);

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SheetDemoComponent],
      providers: [
        ...commonTestingProviders,
        { provide: GigWorkflowService, useValue: gigWorkflowSpy },
        { provide: SpreadsheetService, useValue: spreadsheetSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('createDemoSheet - success path should call workflow and link sheet', async () => {
    gigWorkflowSpy.createFile.and.returnValue(Promise.resolve({ id: 'fid', name: 'Demo file' } as any));
    gigWorkflowSpy.createSheet.and.returnValue(Promise.resolve());
    gigWorkflowSpy.insertDemoData.and.returnValue(Promise.resolve());
    spreadsheetSpy.add.and.returnValue(Promise.resolve());

    spyOn(component.parentReload, 'emit');

    await component.createDemoSheet();

    expect(gigWorkflowSpy.createFile).toHaveBeenCalled();
    expect(gigWorkflowSpy.createSheet).toHaveBeenCalledWith('fid');
    expect(gigWorkflowSpy.insertDemoData).toHaveBeenCalledWith('fid');
    expect(spreadsheetSpy.add).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'fid' }));
    expect(component.parentReload.emit).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.creatingDemo).toBeFalse();
  });

  it('createDemoSheet - failure path should log and show error snackbar', async () => {
    gigWorkflowSpy.createFile.and.returnValue(Promise.resolve(null as any));

    spyOn(component.parentReload, 'emit');

    await component.createDemoSheet();

    expect(loggerSpy.error).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.creatingDemo).toBeFalse();
    expect(component.parentReload.emit).not.toHaveBeenCalled();
  });
});
