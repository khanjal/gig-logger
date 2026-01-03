import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DiagnosticsComponent } from './diagnostics.component';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { AddressService } from '@services/sheets/address.service';
import { PlaceService } from '@services/sheets/place.service';
import { NameService } from '@services/sheets/name.service';
import { LoggerService } from '@services/logger.service';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DiagnosticsComponent', () => {
  let component: DiagnosticsComponent;
  let fixture: ComponentFixture<DiagnosticsComponent>;
  let shiftServiceSpy: jasmine.SpyObj<ShiftService>;
  let tripServiceSpy: jasmine.SpyObj<TripService>;
  let addressServiceSpy: jasmine.SpyObj<AddressService>;
  let placeServiceSpy: jasmine.SpyObj<PlaceService>;
  let nameServiceSpy: jasmine.SpyObj<NameService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    shiftServiceSpy = jasmine.createSpyObj('ShiftService', ['list']);
    tripServiceSpy = jasmine.createSpyObj('TripService', ['list']);
    addressServiceSpy = jasmine.createSpyObj('AddressService', ['list']);
    placeServiceSpy = jasmine.createSpyObj('PlaceService', ['list']);
    nameServiceSpy = jasmine.createSpyObj('NameService', ['list']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['debug', 'info', 'error']);

    shiftServiceSpy.list.and.returnValue(Promise.resolve([]));
    tripServiceSpy.list.and.returnValue(Promise.resolve([]));
    addressServiceSpy.list.and.returnValue(Promise.resolve([]));
    placeServiceSpy.list.and.returnValue(Promise.resolve([]));
    nameServiceSpy.list.and.returnValue(Promise.resolve([]));

    await TestBed.configureTestingModule({
      imports: [DiagnosticsComponent],
      providers: [
        { provide: ShiftService, useValue: shiftServiceSpy },
        { provide: TripService, useValue: tripServiceSpy },
        { provide: AddressService, useValue: addressServiceSpy },
        { provide: PlaceService, useValue: placeServiceSpy },
        { provide: NameService, useValue: nameServiceSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DiagnosticsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('runDiagnostics', () => {
    it('sets loading state while running', fakeAsync(() => {
      component.runDiagnostics();
      
      expect(component.isLoading).toBeTrue();
      
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('clears previous results', async () => {
      component.dataDiagnostics = [{ name: 'Old', count: 1, severity: 'info', description: 'test' }];
      
      await component.runDiagnostics();
      
      expect(component.dataDiagnostics.length).toBeGreaterThan(0);
      expect(component.dataDiagnostics[0].name).not.toBe('Old');
    });

    it('calls all service list methods', async () => {
      await component.runDiagnostics();
      
      expect(shiftServiceSpy.list).toHaveBeenCalled();
      expect(tripServiceSpy.list).toHaveBeenCalled();
      expect(addressServiceSpy.list).toHaveBeenCalled();
      expect(placeServiceSpy.list).toHaveBeenCalled();
      expect(nameServiceSpy.list).toHaveBeenCalled();
    });

    it('populates dataDiagnostics array', async () => {
      await component.runDiagnostics();
      
      expect(component.dataDiagnostics.length).toBeGreaterThan(0);
    });
  });

  describe('findDuplicateShifts', () => {
    it('finds shifts with duplicate keys', async () => {
      const shifts = [
        { id: 1, key: 'shift-1' } as IShift,
        { id: 2, key: 'shift-1' } as IShift,
        { id: 3, key: 'shift-2' } as IShift
      ];
      shiftServiceSpy.list.and.returnValue(Promise.resolve(shifts));
      
      await component.runDiagnostics();
      
      const duplicateShiftsItem = component.dataDiagnostics.find(d => d.name === 'Duplicate Shifts');
      expect(duplicateShiftsItem?.count).toBe(2);
    });

    it('returns empty when no duplicates', async () => {
      const shifts = [
        { id: 1, key: 'shift-1' } as IShift,
        { id: 2, key: 'shift-2' } as IShift
      ];
      shiftServiceSpy.list.and.returnValue(Promise.resolve(shifts));
      
      await component.runDiagnostics();
      
      const duplicateShiftsItem = component.dataDiagnostics.find(d => d.name === 'Duplicate Shifts');
      expect(duplicateShiftsItem?.count).toBe(0);
    });
  });

  describe('findOrphanedTrips', () => {
    it('finds trips without matching shifts', async () => {
      const shifts = [{ id: 1, key: 'shift-1' } as IShift];
      const trips = [
        { id: 1, key: 'shift-1', exclude: false } as ITrip,
        { id: 2, key: 'shift-2', exclude: false } as ITrip
      ];
      shiftServiceSpy.list.and.returnValue(Promise.resolve(shifts));
      tripServiceSpy.list.and.returnValue(Promise.resolve(trips));
      
      await component.runDiagnostics();
      
      const orphanedItem = component.dataDiagnostics.find(d => d.name === 'Orphaned Trips');
      expect(orphanedItem?.count).toBe(1);
    });

    it('ignores excluded trips', async () => {
      const shifts = [] as IShift[];
      const trips = [
        { id: 1, key: 'shift-1', exclude: true } as ITrip
      ];
      shiftServiceSpy.list.and.returnValue(Promise.resolve(shifts));
      tripServiceSpy.list.and.returnValue(Promise.resolve(trips));
      
      await component.runDiagnostics();
      
      const orphanedItem = component.dataDiagnostics.find(d => d.name === 'Orphaned Trips');
      expect(orphanedItem?.count).toBe(0);
    });
  });

  describe('findDuplicatePlaces', () => {
    it('finds places with case differences', async () => {
      const places = [
        { id: 1, place: 'McDonald\'s' } as any,
        { id: 2, place: 'mcDonald\'s' } as any
      ];
      placeServiceSpy.list.and.returnValue(Promise.resolve(places));
      
      await component.runDiagnostics();
      
      const duplicatePlacesItem = component.dataDiagnostics.find(d => d.name === 'Duplicate Places');
      expect(duplicatePlacesItem?.count).toBe(2);
    });

    it('skips places with insufficient length', async () => {
      const places = [
        { id: 1, place: 'A' } as any,
        { id: 2, place: 'a' } as any
      ];
      placeServiceSpy.list.and.returnValue(Promise.resolve(places));
      
      await component.runDiagnostics();
      
      const duplicatePlacesItem = component.dataDiagnostics.find(d => d.name === 'Duplicate Places');
      expect(duplicatePlacesItem?.count).toBe(0);
    });
  });

  describe('findDuplicateNames', () => {
    it('finds names with case differences', async () => {
      const names = [
        { id: 1, name: 'John Smith' } as any,
        { id: 2, name: 'john smith' } as any
      ];
      nameServiceSpy.list.and.returnValue(Promise.resolve(names));
      
      await component.runDiagnostics();
      
      const duplicateNamesItem = component.dataDiagnostics.find(d => d.name === 'Duplicate Names');
      expect(duplicateNamesItem?.count).toBe(2);
    });
  });

  describe('getSeverityIcon', () => {
    it('returns correct icon for each severity', () => {
      expect(component.getSeverityIcon('error')).toBe('error');
      expect(component.getSeverityIcon('warning')).toBe('warning');
      expect(component.getSeverityIcon('info')).toBe('info');
    });
  });

  describe('getSeverityColor', () => {
    it('returns correct color for each severity', () => {
      expect(component.getSeverityColor('error')).toBe('warn');
      expect(component.getSeverityColor('warning')).toBe('accent');
      expect(component.getSeverityColor('info')).toBe('primary');
    });
  });
});
