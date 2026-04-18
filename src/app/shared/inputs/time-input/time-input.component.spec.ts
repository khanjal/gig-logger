import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeInputComponent } from './time-input.component';

describe('TimeInputComponent', () => {
  let component: TimeInputComponent;
  let fixture: ComponentFixture<TimeInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the current time and emits the change', () => {
    const timeChangedSpy = spyOn(component.timeChanged, 'emit');

    component.setCurrentTime();

    expect(component.value).toMatch(/\d{1,2}:\d{2}\s(?:AM|PM)/);
    expect(timeChangedSpy).toHaveBeenCalledWith(component.value);
  });

  it('clears the current time and emits the change', () => {
    const timeChangedSpy = spyOn(component.timeChanged, 'emit');
    component.value = '9:30 AM';

    component.clearTime();

    expect(component.value).toBe('');
    expect(timeChangedSpy).toHaveBeenCalledWith('');
  });

  it('normalizes timepicker events to a string value', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    const timeChangedSpy = spyOn(component.timeChanged, 'emit');
    component.registerOnChange(onChangeSpy);

    component.onTimeChange({ value: '2:45 PM' });

    expect(component.value).toBe('2:45 PM');
    expect(onChangeSpy).toHaveBeenCalledWith('2:45 PM');
    expect(timeChangedSpy).toHaveBeenCalledWith('2:45 PM');
  });
});
