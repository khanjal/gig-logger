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

  it('emits save when save clicked and enabled', () => {
    const saveSpy = spyOn(component.save, 'emit');
    component.hasUnsavedChanges = true;
    component.status = 'idle';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[mat-raised-button][color="primary"]'));
    button.triggerEventHandler('click', new MouseEvent('click'));

    expect(saveSpy).toHaveBeenCalled();
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

  it('emits refresh when update clicked and no unsaved changes', () => {
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

  it('emits theme changes for each button', () => {
    const themeSpy = spyOn(component.themeChange, 'emit');
    fixture.detectChanges();

    const themeButtons = fixture.debugElement.queryAll(By.css('.quick-theme-button'));
    themeButtons[0].triggerEventHandler('click', new MouseEvent('click'));
    themeButtons[1].triggerEventHandler('click', new MouseEvent('click'));
    themeButtons[2].triggerEventHandler('click', new MouseEvent('click'));

    expect(themeSpy.calls.allArgs()).toEqual([['light'], ['dark'], ['system']]);
  });
});
