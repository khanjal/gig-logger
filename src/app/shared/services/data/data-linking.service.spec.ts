import { TestBed } from '@angular/core/testing';
import { DataLinkingService } from './data-linking.service';
import { AddressService } from '../sheets/address.service';
import { NameService } from '../sheets/name.service';
import { PlaceService } from '../sheets/place.service';
import { RegionService } from '../sheets/region.service';
import { ServiceService } from '../sheets/service.service';
import { TripService } from '../sheets/trip.service';
import { TypeService } from '../sheets/type.service';
import { DeliveryService } from '../delivery.service';
import { LoggerService } from '../logger.service';
import { ITrip } from '@interfaces/trip.interface';
import { IDelivery } from '@interfaces/delivery.interface';

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
  let deliverySpy: jasmine.SpyObj<DeliveryService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    addressSpy = jasmine.createSpyObj('AddressService', ['list', 'append', 'update', 'deleteUnsaved', 'find', 'add']);
    nameSpy = jasmine.createSpyObj('NameService', ['list', 'append', 'update', 'deleteUnsaved', 'find', 'add']);
    placeSpy = jasmine.createSpyObj('PlaceService', ['list', 'update', 'deleteUnsaved', 'find', 'add']);
    regionSpy = jasmine.createSpyObj('RegionService', ['deleteUnsaved', 'find', 'add']);
    serviceSpy = jasmine.createSpyObj('ServiceService', ['deleteUnsaved', 'find', 'add']);
    tripSpy = jasmine.createSpyObj('TripService', ['list', 'getPreviousDays']);
    typeSpy = jasmine.createSpyObj('TypeService', ['deleteUnsaved', 'find', 'add']);
    deliverySpy = jasmine.createSpyObj('DeliveryService', ['getRemoteDeliveries', 'loadDeliveries']);
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
        { provide: DeliveryService, useValue: deliverySpy },
        { provide: LoggerService, useValue: loggerSpy },
      ]
    });

    service = TestBed.inject(DataLinkingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('linkDeliveries', () => {
    it('merges existing deliveries and updates totals', async () => {
      const existing: IDelivery[] = [{
        address: '456 B St',
        name: 'John',
        bonus: 0,
        cash: 0,
        pay: 0,
        tip: 0,
        trips: [],
        total: 0,
        visits: 0,
        dates: [],
        places: [],
        services: [],
        units: [],
        notes: []
      } as IDelivery];
      deliverySpy.getRemoteDeliveries.and.returnValue(Promise.resolve(existing));

      const trips = [makeTrip()];

      await service.linkDeliveries(trips);

      expect(deliverySpy.loadDeliveries).toHaveBeenCalled();
      const updated = deliverySpy.loadDeliveries.calls.mostRecent().args[0][0];
      expect(updated.pay).toBeGreaterThan(0);
      expect(updated.visits).toBe(1);
      expect(updated.trips.length).toBe(1);
      expect(updated.dates.length).toBe(1);
    });

    it('creates new delivery when none exists', async () => {
      deliverySpy.getRemoteDeliveries.and.returnValue(Promise.resolve([]));
      const trips = [makeTrip()];

      await service.linkDeliveries(trips);

      expect(deliverySpy.loadDeliveries).toHaveBeenCalled();
      const deliveriesArg = deliverySpy.loadDeliveries.calls.mostRecent().args[0];
      expect(deliveriesArg.length).toBe(1);
      expect(deliveriesArg[0].address).toBe('456 B St');
    });
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

  describe('linkAllData', () => {
    it('runs linkNameData, linkAddressData, and linkPlaceData', async () => {
      const linkName = spyOn<any>(service, 'linkNameData').and.returnValue(Promise.resolve());
      const linkAddr = spyOn<any>(service, 'linkAddressData').and.returnValue(Promise.resolve());
      const linkPlace = spyOn<any>(service, 'linkPlaceData').and.returnValue(Promise.resolve());

      await service.linkAllData();

      expect(linkName).toHaveBeenCalled();
      expect(linkAddr).toHaveBeenCalled();
      expect(linkPlace).toHaveBeenCalled();
    });
  });
});
