import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { QuickControlsComponent } from './quick-controls.component';
import { BaseButtonComponent } from '@components/base';
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

  const getBaseButton = (text: string) => {
    const buttons = fixture.debugElement.queryAll(By.directive(BaseButtonComponent));
    return buttons.find((button) => button.nativeElement.textContent?.trim().includes(text)) ?? null;
  };

  it('shows and emits save when unsaved changes exist', () => {
    const saveSpy = spyOn(component.save, 'emit');
    component.hasUnsavedChanges = true;
    component.status = 'idle';
    fixture.detectChanges();

    const button = getBaseButton('Save');
    expect(button).not.toBeNull();
    button?.triggerEventHandler('clicked', null);

    expect(saveSpy).toHaveBeenCalled();
  });

  it('hides save when no unsaved changes', () => {
    component.hasUnsavedChanges = false;
    component.status = 'idle';
    fixture.detectChanges();

    const saveButton = getBaseButton('Save');
    expect(saveButton).toBeNull();
  });

  it('does not emit save when syncing (button disabled)', () => {
    const saveSpy = spyOn(component.save, 'emit');
    component.hasUnsavedChanges = true;
    component.status = 'syncing';
    fixture.detectChanges();

    const button = getBaseButton('Save');
    expect(button).not.toBeNull();
    button?.triggerEventHandler('clicked', null);

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('shows and emits refresh when no unsaved changes', () => {
    const refreshSpy = spyOn(component.refresh, 'emit');
    component.hasUnsavedChanges = false;
    component.status = 'idle';
    fixture.detectChanges();

    const refreshButton = getBaseButton('Update');
    expect(refreshButton).not.toBeNull();
    refreshButton?.triggerEventHandler('clicked', null);

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

    const cycleButton = getBaseButton('mode');
    expect(cycleButton).not.toBeNull();

    // system -> light
    cycleButton?.triggerEventHandler('clicked', null);
    // simulate input change
    component.themePreference = 'light';
    fixture.detectChanges();

    // light -> dark
    cycleButton?.triggerEventHandler('clicked', null);
    component.themePreference = 'dark';
    fixture.detectChanges();

    // dark -> system
    cycleButton?.triggerEventHandler('clicked', null);

    expect(themeSpy.calls.allArgs()).toEqual([['light'], ['dark'], ['system']]);
  });
});
