import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiagnosticGroupComponent } from './diagnostic-group.component';

describe('DiagnosticGroupComponent', () => {
  let component: DiagnosticGroupComponent;
  let fixture: ComponentFixture<DiagnosticGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosticGroupComponent, FormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DiagnosticGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('canMerge', () => {
    it('should return true for mergeable item types', () => {
      const mergeableTypes = ['place', 'name', 'address', 'service', 'region'];
      mergeableTypes.forEach(type => {
        component.itemType = type as any;
        expect(component.canMerge).toBe(true);
      });
    });

    it('should return false for non-mergeable item types', () => {
      component.itemType = 'shift';
      expect(component.canMerge).toBe(false);
      component.itemType = 'trip';
      expect(component.canMerge).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should return true only for shift item type', () => {
      component.itemType = 'shift';
      expect(component.canDelete).toBe(true);
    });

    it('should return false for non-shift item types', () => {
      const nonShiftTypes = ['trip', 'place', 'name', 'address', 'service', 'region'];
      nonShiftTypes.forEach(type => {
        component.itemType = type as any;
        expect(component.canDelete).toBe(false);
      });
    });
  });

  describe('hasMarkedForDelete', () => {
    it('should return true if any item is marked for delete', () => {
      const group = [
        { id: 1, markedForDelete: false },
        { id: 2, markedForDelete: true },
        { id: 3, markedForDelete: false }
      ];
      expect(component.hasMarkedForDelete(group)).toBe(true);
    });

    it('should return false if no items are marked for delete', () => {
      const group = [
        { id: 1, markedForDelete: false },
        { id: 2, markedForDelete: false }
      ];
      expect(component.hasMarkedForDelete(group)).toBe(false);
    });

    it('should return false for empty group', () => {
      expect(component.hasMarkedForDelete([])).toBe(false);
    });
  });

  describe('onMergeClick', () => {
    it('should emit merge event when selectedValue is set', () => {
      spyOn(component.merge, 'emit');
      component.group = [{ id: 1 }, { id: 2 }];
      component.selectedValue = { id: 1 };
      component.itemType = 'place';

      component.onMergeClick();

      expect(component.merge.emit).toHaveBeenCalledWith({
        group: component.group,
        value: component.selectedValue,
        itemType: 'place'
      });
    });

    it('should not emit merge event when selectedValue is not set', () => {
      spyOn(component.merge, 'emit');
      component.selectedValue = undefined;

      component.onMergeClick();

      expect(component.merge.emit).not.toHaveBeenCalled();
    });
  });

  describe('onDeleteClick', () => {
    it('should emit deleteShift event when selectedShiftToDelete is set', () => {
      spyOn(component.deleteShift, 'emit');
      component.group = [{ rowId: 1 }, { rowId: 2 }];
      component.selectedShiftToDelete = 1;
      component.groupIndex = 0;

      component.onDeleteClick();

      expect(component.deleteShift.emit).toHaveBeenCalledWith({
        group: component.group,
        shiftId: 1,
        groupIndex: 0
      });
    });

    it('should not emit deleteShift event when selectedShiftToDelete is not set', () => {
      spyOn(component.deleteShift, 'emit');
      component.selectedShiftToDelete = undefined;

      component.onDeleteClick();

      expect(component.deleteShift.emit).not.toHaveBeenCalled();
    });
  });

  describe('onValueChange', () => {
    it('should emit selectedValueChange event', () => {
      spyOn(component.selectedValueChange, 'emit');
      const value = { id: 1, name: 'test' };

      component.onValueChange(value);

      expect(component.selectedValueChange.emit).toHaveBeenCalledWith(value);
    });
  });

  describe('onShiftChange', () => {
    it('should emit selectedShiftToDeleteChange event', () => {
      spyOn(component.selectedShiftToDeleteChange, 'emit');

      component.onShiftChange(123);

      expect(component.selectedShiftToDeleteChange.emit).toHaveBeenCalledWith(123);
    });
  });
});
