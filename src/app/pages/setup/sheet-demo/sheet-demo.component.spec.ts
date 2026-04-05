import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { of } from 'rxjs';
import { SheetDemoComponent } from './sheet-demo.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthGoogleService } from '@services/auth-google.service';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';

describe('SheetDemoComponent', () => {
  let component: SheetDemoComponent;
  let fixture: ComponentFixture<SheetDemoComponent>;

  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let authSpy: jasmine.SpyObj<AuthGoogleService>;

  beforeEach(async () => {
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    authSpy = jasmine.createSpyObj('AuthGoogleService', ['canSync']);

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SheetDemoComponent],
      providers: [
        ...commonTestingProviders,
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: AuthGoogleService, useValue: authSpy }
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

  it('createDemoSheet - opens sync modal in create-demo mode and emits on success', async () => {
    authSpy.canSync.and.resolveTo(true);
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(true)
    } as any);

    spyOn(component.parentReload, 'emit');

    await component.createDemoSheet();

    expect(authSpy.canSync).toHaveBeenCalled();
    expect(dialogSpy.open).toHaveBeenCalledWith(DataSyncModalComponent, jasmine.objectContaining({
      panelClass: 'custom-modalbox',
      data: 'create-demo'
    }));
    expect(component.parentReload.emit).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.creatingDemo).toBeFalse();
  });

  it('createDemoSheet - does not open modal when user is not authenticated', async () => {
    authSpy.canSync.and.resolveTo(false);

    spyOn(component.parentReload, 'emit');

    await component.createDemoSheet();

    expect(dialogSpy.open).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.creatingDemo).toBeFalse();
    expect(component.parentReload.emit).not.toHaveBeenCalled();
  });

  it('createDemoSheet - does not emit parent reload when modal closes without success', async () => {
    authSpy.canSync.and.resolveTo(true);
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(false)
    } as any);

    spyOn(component.parentReload, 'emit');

    await component.createDemoSheet();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(component.creatingDemo).toBeFalse();
    expect(component.parentReload.emit).not.toHaveBeenCalled();
  });
});
