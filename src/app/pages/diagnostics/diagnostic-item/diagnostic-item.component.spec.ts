import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DiagnosticItemComponent } from './diagnostic-item.component';

describe('DiagnosticItemComponent', () => {
  let component: DiagnosticItemComponent;
  let fixture: ComponentFixture<DiagnosticItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosticItemComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DiagnosticItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onFixShiftDuration', () => {
    it('should emit fixShiftDuration event', () => {
      spyOn(component.fixShiftDuration, 'emit');
      component.item = { id: 1, date: '2024-01-01' };

      component.onFixShiftDuration();

      expect(component.fixShiftDuration.emit).toHaveBeenCalledWith(component.item);
    });
  });

  describe('onFixTripDuration', () => {
    it('should emit fixTripDuration event', () => {
      spyOn(component.fixTripDuration, 'emit');
      component.item = { id: 1, date: '2024-01-01' };

      component.onFixTripDuration();

      expect(component.fixTripDuration.emit).toHaveBeenCalledWith(component.item);
    });
  });

  describe('onApplyAddress', () => {
    it('should emit applyAddress event when selectedAddress is set', () => {
      spyOn(component.applyAddress, 'emit');
      component.item = { id: 1 };
      component.selectedAddress = '123 Main St';

      component.onApplyAddress();

      expect(component.applyAddress.emit).toHaveBeenCalledWith({
        item: component.item,
        address: '123 Main St'
      });
    });

    it('should not emit applyAddress event when selectedAddress is empty string', () => {
      spyOn(component.applyAddress, 'emit');
      component.item = { id: 1 };
      component.selectedAddress = '';

      component.onApplyAddress();

      expect(component.applyAddress.emit).not.toHaveBeenCalled();
    });

    it('should not emit applyAddress event when selectedAddress is not set', () => {
      spyOn(component.applyAddress, 'emit');
      component.selectedAddress = undefined;

      component.onApplyAddress();

      expect(component.applyAddress.emit).not.toHaveBeenCalled();
    });
  });

  describe('onCreateShift', () => {
    it('should emit createShift event', () => {
      spyOn(component.createShift, 'emit');
      const itemRef = { id: 1, date: '2024-01-01' };
      component.item = itemRef;

      component.onCreateShift();

      expect(component.createShift.emit).toHaveBeenCalledWith(itemRef);
    });
  });

  it('should initialize safely with default item and not throw during change detection', () => {
    // Default item is an empty object; detectChanges already ran in beforeEach
    expect(component.item).toEqual({});
  });

  describe('onAddressChange', () => {
    it('should emit selectedAddressChange event', () => {
      spyOn(component.selectedAddressChange, 'emit');

      component.onAddressChange('456 Oak Ave');

      expect(component.selectedAddressChange.emit).toHaveBeenCalledWith('456 Oak Ave');
    });
  });
});
