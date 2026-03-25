import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheetListComponent } from './sheet-list.component';
import { GigWorkflowService } from '@services/gig-workflow.service';
import { LoggerService } from '@services/logger.service';
import { MatDialogRef } from '@angular/material/dialog';

describe('SheetListComponent', () => {
  let component: SheetListComponent;
  let fixture: ComponentFixture<SheetListComponent>;
  let gigSpy: jasmine.SpyObj<GigWorkflowService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let dialogRefSpy: { close: jasmine.Spy };

  beforeEach(async () => {
    gigSpy = jasmine.createSpyObj('GigWorkflowService', ['listFiles']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['error', 'info', 'debug']);
    dialogRefSpy = { close: jasmine.createSpy('close') };

    await TestBed.configureTestingModule({
      imports: [SheetListComponent],
      providers: [
        { provide: GigWorkflowService, useValue: gigSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SheetListComponent);
    component = fixture.componentInstance;
    // inject MatDialogRef via any - SheetListComponent constructor expects MatDialogRef
    (component as any).dialogRef = dialogRefSpy as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loadSheets sorts results alphabetically', async () => {
    gigSpy.listFiles.and.returnValue(Promise.resolve([
      { id: '2', name: 'BBB' },
      { id: '1', name: 'aaa' }
    ] as any));

    await component.loadSheets();
    expect(component.sheets.length).toBe(2);
    expect(component.sheets[0].name.toLowerCase()).toBe('aaa');
  });

  it('selectSheet and confirmSelection close dialog with selection', () => {
    const sheet = { id: 's1', name: 'one' } as any;
    component.selectSheet(sheet);
    expect(component.selectedSheet).toBe(sheet);
    component.confirmSelection();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(sheet);
  });

  it('cancel closes dialog with null', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('trackBySheetId returns id', () => {
    const sheet = { id: 'track-123' } as any;
    expect(component.trackBySheetId(0, sheet)).toBe('track-123');
  });

  it('formatFileSize formats bytes correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 Bytes');
    expect(component.formatFileSize(1024)).toBe('1 KB');
    expect(component.formatFileSize(1536)).toBe('1.5 KB');
  });
});
