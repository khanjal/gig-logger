import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { MatDialogRef } from '@angular/material/dialog';
import { SheetCreateComponent } from './sheet-create.component';

describe('SheetCreateComponent', () => {
  let component: SheetCreateComponent;
  let fixture: ComponentFixture<SheetCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SheetCreateComponent],
      providers: [...commonTestingProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('createSheet closes dialog with trimmed sheetName', () => {
    const dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<SheetCreateComponent>>;
    spyOn(dialogRef, 'close');
    component.sheetCreate.setValue({ sheetName: '  My Sheet  ' });
    component.createSheet();
    expect(dialogRef.close).toHaveBeenCalledWith({ sheetName: 'My Sheet' });
  });

  it('closeModal closes dialog with null', () => {
    const dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<SheetCreateComponent>>;
    spyOn(dialogRef, 'close');
    component.closeModal();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
