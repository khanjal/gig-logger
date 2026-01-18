import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { QuickControlsComponent } from './quick-controls.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

describe('QuickControlsComponent', () => {
  let component: QuickControlsComponent;
  let fixture: ComponentFixture<QuickControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickControlsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(QuickControlsComponent);
    component = fixture.componentInstance;
  });

  it('shows and emits save when unsaved changes exist', () => {
    const saveSpy = spyOn(component.save, 'emit');
    component.hasUnsavedChanges = true;
    component.status = 'idle';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[mat-raised-button][color="primary"]'));
    button.triggerEventHandler('click', new MouseEvent('click'));

    expect(saveSpy).toHaveBeenCalled();
  });

  it('hides save when no unsaved changes', () => {
    component.hasUnsavedChanges = false;
    component.status = 'idle';
    fixture.detectChanges();

    const saveButton = fixture.debugElement.query(By.css('button[mat-raised-button][color="primary"]'));
    expect(saveButton).toBeNull();
  });

  it('does not emit save when syncing (button disabled)', () => {
    const saveSpy = spyOn(component.save, 'emit');
    component.hasUnsavedChanges = true;
    component.status = 'syncing';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[mat-raised-button][color="primary"]'));
    button.triggerEventHandler('click', new MouseEvent('click'));

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('shows and emits refresh when no unsaved changes', () => {
    const refreshSpy = spyOn(component.refresh, 'emit');
    component.hasUnsavedChanges = false;
    component.status = 'idle';
    fixture.detectChanges();

    const refreshButton = fixture.debugElement.query(By.css('button[color="accent"]'));
    refreshButton.triggerEventHandler('click', new MouseEvent('click'));

    expect(refreshSpy).toHaveBeenCalled();
  });

  it('emits auto-save toggle value', () => {
    const autoSaveSpy = spyOn(component.autoSaveToggle, 'emit');
    fixture.detectChanges();

    component.onAutoSaveToggle({ checked: true } as MatSlideToggleChange);

    expect(autoSaveSpy).toHaveBeenCalledWith(true);
  });

  it('cycles theme on single button', () => {
    const themeSpy = spyOn(component.themeChange, 'emit');
    fixture.detectChanges();

    const cycleButton = fixture.debugElement.query(By.css('button[mat-stroked-button]'));

    // system -> light
    cycleButton.triggerEventHandler('click', new MouseEvent('click'));
    // simulate input change
    component.themePreference = 'light';
    fixture.detectChanges();

    // light -> dark
    cycleButton.triggerEventHandler('click', new MouseEvent('click'));
    component.themePreference = 'dark';
    fixture.detectChanges();

    // dark -> system
    cycleButton.triggerEventHandler('click', new MouseEvent('click'));

    expect(themeSpy.calls.allArgs()).toEqual([['light'], ['dark'], ['system']]);
  });
});
