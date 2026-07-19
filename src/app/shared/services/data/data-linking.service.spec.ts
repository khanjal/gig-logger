import { TestBed } from '@angular/core/testing';
import { DataLinkingService } from './data-linking.service';
import { AddressService } from '../sheets/address.service';
import { NameService } from '../sheets/name.service';
import { PlaceService } from '../sheets/place.service';
import { RegionService } from '../sheets/region.service';
import { ServiceService } from '../sheets/service.service';
import { TripService } from '../sheets/trip.service';
import { TypeService } from '../sheets/type.service';
import { LoggerService } from '../logger.service';
import type { ITrip } from '@interfaces/entities/trip.interface';

const makeTrip = (overrides: Partial<ITrip> = {}): ITrip => ({
  id: overrides.id ?? 1,
  key: overrides.key ?? '2024-01-01_1',
  date: overrides.date ?? '2024-01-01',
  service: overrides.service ?? 'Uber',
  number: overrides.number ?? 1,
  region: overrides.region ?? 'Downtown',
  pickupTime: overrides.pickupTime ?? '08:00:00',
  dropoffTime: overrides.dropoffTime ?? '09:00:00',
  duration: overrides.duration ?? '01:00:00',
  place: overrides.place ?? 'Airport',
  name: overrides.name ?? 'John',
  startAddress: overrides.startAddress ?? '123 A St',
  endAddress: overrides.endAddress ?? '456 B St',
  endUnit: overrides.endUnit ?? 'Unit 1',
  distance: overrides.distance ?? 12,
  pay: overrides.pay ?? 20,
  tip: overrides.tip ?? 5,
  bonus: overrides.bonus ?? 2,
  cash: overrides.cash ?? 0,
  total: overrides.total ?? 27,
  type: overrides.type ?? 'Pickup',
  note: overrides.note ?? 'Note',
  exclude: overrides.exclude ?? false,
  amountPerDistance: overrides.amountPerDistance ?? 0,
  amountPerTime: overrides.amountPerTime ?? 0,
  action: overrides.action ?? '',
  actionTime: overrides.actionTime ?? 0,
  rowId: overrides.rowId ?? 1,
  saved: overrides.saved ?? true,
} as ITrip);


describe('DataLinkingService', () => {
  let service: DataLinkingService;
  let addressSpy: jasmine.SpyObj<AddressService>;
  let nameSpy: jasmine.SpyObj<NameService>;
  let placeSpy: jasmine.SpyObj<PlaceService>;
  let regionSpy: jasmine.SpyObj<RegionService>;
  let serviceSpy: jasmine.SpyObj<ServiceService>;
  let tripSpy: jasmine.SpyObj<TripService>;
  let typeSpy: jasmine.SpyObj<TypeService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    addressSpy = jasmine.createSpyObj('AddressService', ['deleteUnsaved', 'find', 'add']);
    nameSpy = jasmine.createSpyObj('NameService', ['deleteUnsaved', 'find', 'add']);
    placeSpy = jasmine.createSpyObj('PlaceService', ['deleteUnsaved', 'find', 'add']);
    regionSpy = jasmine.createSpyObj('RegionService', ['deleteUnsaved', 'find', 'add']);
    serviceSpy = jasmine.createSpyObj('ServiceService', ['deleteUnsaved', 'find', 'add']);
    tripSpy = jasmine.createSpyObj('TripService', ['getPreviousDays']);
    typeSpy = jasmine.createSpyObj('TypeService', ['deleteUnsaved', 'find', 'add']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        DataLinkingService,
        { provide: AddressService, useValue: addressSpy },
        { provide: NameService, useValue: nameSpy },
        { provide: PlaceService, useValue: placeSpy },
        { provide: RegionService, useValue: regionSpy },
        { provide: ServiceService, useValue: serviceSpy },
        { provide: TripService, useValue: tripSpy },
        { provide: TypeService, useValue: typeSpy },
        { provide: LoggerService, useValue: loggerSpy },
      ]
    });

    service = TestBed.inject(DataLinkingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateAncillaryInfo', () => {
    it('deletes unsaved and adds missing entries from recent trips', async () => {
      tripSpy.getPreviousDays.and.returnValue(Promise.resolve([
        makeTrip({ endAddress: '456 B St', name: 'John', place: 'Airport', region: 'Downtown', service: 'Uber', startAddress: '123 A St', type: 'Pickup' })
      ]));

      addressSpy.find.and.returnValue(Promise.resolve(undefined));
      nameSpy.find.and.returnValue(Promise.resolve(undefined));
      placeSpy.find.and.returnValue(Promise.resolve(undefined));
      regionSpy.find.and.returnValue(Promise.resolve(undefined));
      serviceSpy.find.and.returnValue(Promise.resolve(undefined));
      typeSpy.find.and.returnValue(Promise.resolve(undefined));

      await service.updateAncillaryInfo();

      expect(addressSpy.deleteUnsaved).toHaveBeenCalled();
      expect(nameSpy.deleteUnsaved).toHaveBeenCalled();
      expect(placeSpy.deleteUnsaved).toHaveBeenCalled();
      expect(regionSpy.deleteUnsaved).toHaveBeenCalled();
      expect(serviceSpy.deleteUnsaved).toHaveBeenCalled();
      expect(typeSpy.deleteUnsaved).toHaveBeenCalled();

      expect(addressSpy.add).toHaveBeenCalled();
      expect(nameSpy.add).toHaveBeenCalled();
      expect(placeSpy.add).toHaveBeenCalled();
      expect(regionSpy.add).toHaveBeenCalled();
      expect(serviceSpy.add).toHaveBeenCalled();
      expect(typeSpy.add).toHaveBeenCalled();
    });
  });
});
