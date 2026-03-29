import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheetAddFormComponent } from './sheet-add-form.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SpreadsheetService } from '@services/spreadsheet.service';

describe('SheetSetupFormComponent', () => {
  let component: SheetAddFormComponent;
  let fixture: ComponentFixture<SheetAddFormComponent>;
  let spreadsheetSpy: jasmine.SpyObj<SpreadsheetService>;

  beforeEach(async () => {
    spreadsheetSpy = jasmine.createSpyObj('SpreadsheetService', ['querySpreadsheets', 'update']);
    // Default safe returns to avoid component load() TypeError during detectChanges
    spreadsheetSpy.querySpreadsheets.and.returnValue(Promise.resolve([]));

    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule, SheetAddFormComponent],
      providers: [
        { provide: SpreadsheetService, useValue: spreadsheetSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SheetAddFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads default spreadsheet on init', async () => {
    spreadsheetSpy.querySpreadsheets.and.returnValue(Promise.resolve([{ id: 'default-1' }] as any));
    // trigger load explicitly since ngOnInit already ran during detectChanges
    await component.load();
    expect(component.defaultSpreadsheet?.id).toBe('default-1');
  });

  it('setupSheet calls update with default=true when no default exists', async () => {
    spreadsheetSpy.update.and.returnValue(Promise.resolve());
    component.defaultSpreadsheet = undefined as any;
    await component.setupSheet('SHEET_ID');
    expect(spreadsheetSpy.update).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'SHEET_ID', default: 'true' }));
  });

  it('addSheet extracts id from URL and emits parentReload', async () => {
    spreadsheetSpy.update.and.returnValue(Promise.resolve());
    spyOn(component.parentReload, 'emit');
    component.sheetForm.controls.sheetId.setValue('https://docs.google.com/spreadsheets/d/ABC123/edit#gid=0');
    await component.addSheet();
    expect(spreadsheetSpy.update).toHaveBeenCalled();
    expect(component.parentReload.emit).toHaveBeenCalled();
  });

  it('addSheet does nothing when sheetId is empty', async () => {
    spreadsheetSpy.update.calls.reset();
    component.sheetForm.controls.sheetId.setValue('');
    await component.addSheet();
    expect(spreadsheetSpy.update).not.toHaveBeenCalled();
  });
});
