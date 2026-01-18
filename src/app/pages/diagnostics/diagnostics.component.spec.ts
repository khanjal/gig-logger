import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiagnosticsComponent } from './diagnostics.component';
import { ActionEnum } from '@enums/action.enum';
import { DiagnosticHelper } from '@helpers/diagnostic.helper';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { AddressService } from '@services/sheets/address.service';
import { PlaceService } from '@services/sheets/place.service';
import { NameService } from '@services/sheets/name.service';
import { ServiceService } from '@services/sheets/service.service';
import { RegionService } from '@services/sheets/region.service';
import { LoggerService } from '@services/logger.service';
import { GigCalculatorService } from '@services/calculations/gig-calculator.service';
import { GigWorkflowService } from '@services/gig-workflow.service';

describe('DiagnosticsComponent', () => {
  let component: DiagnosticsComponent;
  let fixture: ComponentFixture<DiagnosticsComponent>;
  let shiftService: any;
  let tripService: any;
  let addressService: any;
  let placeService: any;
  let nameService: any;
  let serviceService: any;
  let regionService: any;
  let loggerService: any;
  let gigCalculator: any;
  let gigWorkflow: any;

  beforeEach(async () => {
    shiftService = jasmine.createSpyObj('ShiftService', ['list', 'findDuplicates', 'update', 'getMaxRowId', 'add', 'delete']);
    tripService = jasmine.createSpyObj('TripService', ['list', 'update']);
    addressService = jasmine.createSpyObj('AddressService', ['list', 'findDuplicates']);
    placeService = jasmine.createSpyObj('PlaceService', ['list', 'findDuplicates']);
    nameService = jasmine.createSpyObj('NameService', ['list', 'findDuplicates']);
    serviceService = jasmine.createSpyObj('ServiceService', ['list', 'findDuplicates']);
    regionService = jasmine.createSpyObj('RegionService', ['findDuplicates']);
    loggerService = jasmine.createSpyObj('LoggerService', ['debug', 'info']);
    gigCalculator = jasmine.createSpyObj('GigCalculatorService', ['updateTripDuration']);
    gigWorkflow = jasmine.createSpyObj('GigWorkflowService', ['calculateShiftTotals']);

    shiftService.list.and.returnValue(Promise.resolve([]));
    shiftService.findDuplicates.and.returnValue(Promise.resolve([]));
    shiftService.update.and.returnValue(Promise.resolve());
    shiftService.getMaxRowId.and.returnValue(Promise.resolve(0));
    shiftService.add.and.returnValue(Promise.resolve());
    shiftService.delete.and.returnValue(Promise.resolve());

    tripService.list.and.returnValue(Promise.resolve([]));
    tripService.update.and.returnValue(Promise.resolve());

    addressService.list.and.returnValue(Promise.resolve([]));
    addressService.findDuplicates.and.returnValue(Promise.resolve([]));
    placeService.list.and.returnValue(Promise.resolve([]));
    placeService.findDuplicates.and.returnValue(Promise.resolve([]));
    nameService.list.and.returnValue(Promise.resolve([]));
    nameService.findDuplicates.and.returnValue(Promise.resolve([]));
    serviceService.list.and.returnValue(Promise.resolve([]));
    serviceService.findDuplicates.and.returnValue(Promise.resolve([]));
    regionService.findDuplicates.and.returnValue(Promise.resolve([]));

    loggerService.debug.and.stub();
    loggerService.info.and.stub();
    gigCalculator.updateTripDuration.and.returnValue(Promise.resolve());
    gigWorkflow.calculateShiftTotals.and.returnValue(Promise.resolve());

    spyOn(DiagnosticHelper, 'recomputeGroupCounts').and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, DiagnosticsComponent],
      providers: [
        ...commonTestingProviders,
        { provide: ShiftService, useValue: shiftService },
        { provide: TripService, useValue: tripService },
        { provide: AddressService, useValue: addressService },
        { provide: PlaceService, useValue: placeService },
        { provide: NameService, useValue: nameService },
        { provide: ServiceService, useValue: serviceService },
        { provide: RegionService, useValue: regionService },
        { provide: LoggerService, useValue: loggerService },
        { provide: GigCalculatorService, useValue: gigCalculator },
        { provide: GigWorkflowService, useValue: gigWorkflow }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagnosticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('runDiagnostics should populate default diagnostics with zero counts', async () => {
    await component.runDiagnostics();

    expect(component.isLoading).toBeFalse();
    expect(component.dataDiagnostics.length).toBe(11);
    expect(component.getTotalIssues()).toBe(0);
  });

  it('getCountBySeverity should sum matching severities', () => {
    component.dataDiagnostics = [
      { name: 'a', count: 1, severity: 'info', description: '', itemType: 'trip', items: [] },
      { name: 'b', count: 2, severity: 'warning', description: '', itemType: 'trip', items: [] },
      { name: 'c', count: 3, severity: 'warning', description: '', itemType: 'trip', items: [] }
    ];

    expect(component.getCountBySeverity('warning')).toBe(5);
    expect(component.getCountBySeverity('info')).toBe(1);
  });

  it('getSeverityIcon and getSeverityColor should map severities', () => {
    expect(component.getSeverityIcon('error')).toBe('error');
    expect(component.getSeverityIcon('warning')).toBe('warning');
    expect(component.getSeverityIcon('info')).toBe('info');

    expect(component.getSeverityColor('error')).toBe('warn');
    expect(component.getSeverityColor('warning')).toBe('accent');
    expect(component.getSeverityColor('info')).toBe('primary');
  });

  it('mergeDuplicates should update related trips and shifts', async () => {
    const trips: ITrip[] = [{ service: 'Old', key: '1' } as ITrip];
    const shifts: IShift[] = [{ service: 'Old', region: 'North' } as IShift];
    tripService.list.and.returnValue(Promise.resolve(trips));
    shiftService.list.and.returnValue(Promise.resolve(shifts));

    const selected = { service: 'New', trips: 5 } as any;
    const other = { service: 'Old', trips: 5 } as any;
    const group = [selected, other];

    await component.mergeDuplicates(group, selected, 'service');

    expect(tripService.update).toHaveBeenCalledWith(jasmine.arrayContaining([jasmine.objectContaining({ service: 'New' })]));
    expect(shiftService.update).toHaveBeenCalledWith(jasmine.arrayContaining([jasmine.objectContaining({ service: 'New' })]));
    expect(other.trips).toBe(0);
  });

  it('fixShiftDuration should compute duration, mark fixed, and decrement count', async () => {
    component.dataDiagnostics = [{ name: 'Shifts Missing Time Duration', count: 1, severity: 'warning', description: '', itemType: 'shift', items: [] } as any];
    const shift: IShift = { start: '2024-01-01T00:00:00Z', finish: '2024-01-01T00:30:00Z' } as IShift;

    await component.fixShiftDuration(shift);

    expect(shiftService.update).toHaveBeenCalledWith([shift]);
    expect((shift as any).fixed).toBeTrue();
    expect(component.getCountBySeverity('warning')).toBe(0);
  });

  it('fixTripDuration should call calculator and decrement count', async () => {
    component.dataDiagnostics = [{ name: 'Trips Missing Duration', count: 1, severity: 'warning', description: '', itemType: 'trip', items: [] } as any];
    const trip = { key: 't1' } as ITrip;

    await component.fixTripDuration(trip);

    expect(gigCalculator.updateTripDuration).toHaveBeenCalledWith(trip);
    expect((trip as any).fixed).toBeTrue();
    expect(component.getCountBySeverity('warning')).toBe(0);
  });

  it('bulkFixShiftDurations should update shifts and rerun diagnostics', async () => {
    const shifts: IShift[] = [{ start: '2024-01-01T00:00:00Z', finish: '2024-01-01T01:00:00Z', time: '' } as IShift];
    shiftService.list.and.returnValue(Promise.resolve(shifts));
    const runDiagnosticsSpy = spyOn(component, 'runDiagnostics').and.returnValue(Promise.resolve());

    await component.bulkFixShiftDurations();

    expect(shiftService.update).toHaveBeenCalled();
    expect(runDiagnosticsSpy).toHaveBeenCalled();
  });

  it('bulkFixTripDurations should recalculate and rerun diagnostics', async () => {
    const trips: ITrip[] = [{ key: '1', pickupTime: '10:00', dropoffTime: '10:10', duration: '' } as ITrip];
    tripService.list.and.returnValue(Promise.resolve(trips));
    const runDiagnosticsSpy = spyOn(component, 'runDiagnostics').and.returnValue(Promise.resolve());

    await component.bulkFixTripDurations();

    expect(gigCalculator.updateTripDuration).toHaveBeenCalledWith(trips[0]);
    expect(runDiagnosticsSpy).toHaveBeenCalled();
  });

  it('applyAddressToTrip should set address and persist', async () => {
    const trip: any = { rowId: 1 };

    await component.applyAddressToTrip(trip, '123 Main');

    expect(trip.startAddress).toBe('123 Main');
    expect(trip.addressApplied).toBeTrue();
    expect(tripService.update).toHaveBeenCalledWith([trip]);
  });

  it('createShiftFromTrip should create shift and mark orphaned trip fixed', async () => {
    const trip: ITrip = { key: 'abc', date: '2024-01-01', service: 'Svc', number: 1, region: 'R1', pickupTime: '10:00', total: 0 } as any;
    component.dataDiagnostics = [{ name: 'Orphaned Trips', count: 1, severity: 'error', description: '', itemType: 'trip', items: [trip] } as any];

    await component.createShiftFromTrip(trip);

    expect(shiftService.getMaxRowId).toHaveBeenCalled();
    expect(gigWorkflow.calculateShiftTotals).toHaveBeenCalled();
    expect(shiftService.add).toHaveBeenCalled();
    expect((trip as any).fixed).toBeTrue();
    expect(component.dataDiagnostics[0].count).toBe(0);
  });

  it('hasMarkedForDelete should detect flagged shifts', () => {
    const shifts: IShift[] = [{ markedForDelete: true } as any];

    expect(component.hasMarkedForDelete(shifts)).toBeTrue();
  });

  it('markShiftForDelete should delete new shifts and clear selection', async () => {
    const rowId = 1;
    const group: IShift[] = [{ rowId, action: ActionEnum.Add } as any];
    component.selectedShiftToDelete = { 0: rowId } as any;

    await component.markShiftForDelete(group, rowId, 0);

    expect(shiftService.delete).toHaveBeenCalled();
    expect((group[0] as any).markedForDelete).toBeTrue();
    expect(component.selectedShiftToDelete[0]).toBeUndefined();
  });

  it('markShiftForDelete should mark existing shifts for delete', async () => {
    const rowId = 2;
    const group: IShift[] = [{ rowId, action: ActionEnum.Update } as any];
    component.selectedShiftToDelete = { 1: rowId } as any;

    await component.markShiftForDelete(group, rowId, 1);

    expect(shiftService.update).toHaveBeenCalled();
    expect((group[0] as any).markedForDelete).toBeTrue();
    expect(component.selectedShiftToDelete[1]).toBeUndefined();
  });
});
