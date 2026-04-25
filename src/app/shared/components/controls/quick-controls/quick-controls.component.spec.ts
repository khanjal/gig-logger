import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { QuickControlsComponent } from './quick-controls.component';
import { BaseRectButtonComponent } from '@components/base';
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
    const buttons = fixture.debugElement.queryAll(By.directive(BaseRectButtonComponent));
    return buttons.find((button) => button.nativeElement.textContent?.trim().includes(text)) ?? null;
  };

  it('does not render save button when unsaved changes exist', () => {
    component.hasUnsavedChanges = true;
    component.status = 'idle';
    fixture.detectChanges();

    const button = getBaseButton('Save');
    expect(button).toBeNull();
  });

  it('does not render save button when no unsaved changes', () => {
    component.hasUnsavedChanges = false;
    component.status = 'idle';
    fixture.detectChanges();

    const saveButton = getBaseButton('Save');
    expect(saveButton).toBeNull();
  });

  it('does not render update button', () => {
    component.hasUnsavedChanges = false;
    component.status = 'syncing';
    fixture.detectChanges();

    const refreshButton = getBaseButton('Update');
    expect(refreshButton).toBeNull();
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
