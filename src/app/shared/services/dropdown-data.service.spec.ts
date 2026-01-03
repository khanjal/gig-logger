import { TestBed } from '@angular/core/testing';
import { DropdownDataService, DropdownType } from './dropdown-data.service';
import { ServiceService } from '@services/sheets/service.service';
import { TypeService } from '@services/sheets/type.service';
import { PlaceService } from '@services/sheets/place.service';
import { AddressService } from '@services/sheets/address.service';
import { RegionService } from '@services/sheets/region.service';
import { LoggerService } from '@services/logger.service';
import { IService } from '@interfaces/service.interface';
import { IType } from '@interfaces/type.interface';
import { IPlace } from '@interfaces/place.interface';
import { IAddress } from '@interfaces/address.interface';
import { IRegion } from '@interfaces/region.interface';

describe('DropdownDataService', () => {
  let service: DropdownDataService;
  let serviceService: jasmine.SpyObj<ServiceService>;
  let typeService: jasmine.SpyObj<TypeService>;
  let placeService: jasmine.SpyObj<PlaceService>;
  let addressService: jasmine.SpyObj<AddressService>;
  let regionService: jasmine.SpyObj<RegionService>;
  let loggerService: jasmine.SpyObj<LoggerService>;

  const mockServices: IService[] = [
    { rowId: 1, service: 'DoorDash' } as IService,
    { rowId: 2, service: 'Uber Eats' } as IService,
    { rowId: 3, service: 'GrubHub' } as IService
  ];

  const mockTypes: IType[] = [
    { rowId: 1, type: 'Food Delivery' } as IType,
    { rowId: 2, type: 'Passenger' } as IType
  ];

  const mockPlaces: IPlace[] = [
    { rowId: 1, place: 'McDonald\'s' } as IPlace,
    { rowId: 2, place: 'Walmart' } as IPlace
  ];

  const mockAddresses: IAddress[] = [
    { rowId: 1, address: '123 Main St' } as IAddress,
    { rowId: 2, address: '456 Oak Ave' } as IAddress
  ];

  const mockRegions: IRegion[] = [
    { rowId: 1, region: 'Downtown' } as IRegion,
    { rowId: 2, region: 'Suburbs' } as IRegion
  ];

  beforeEach(() => {
    const serviceServiceSpy = jasmine.createSpyObj('ServiceService', ['list']);
    const typeServiceSpy = jasmine.createSpyObj('TypeService', ['list']);
    const placeServiceSpy = jasmine.createSpyObj('PlaceService', ['list']);
    const addressServiceSpy = jasmine.createSpyObj('AddressService', ['list']);
    const regionServiceSpy = jasmine.createSpyObj('RegionService', ['list']);
    const loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug']);

    // Mock fetch for canonical lists
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve([])
      } as Response)
    );

    TestBed.configureTestingModule({
      providers: [
        DropdownDataService,
        { provide: ServiceService, useValue: serviceServiceSpy },
        { provide: TypeService, useValue: typeServiceSpy },
        { provide: PlaceService, useValue: placeServiceSpy },
        { provide: AddressService, useValue: addressServiceSpy },
        { provide: RegionService, useValue: regionServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy }
      ]
    });

    service = TestBed.inject(DropdownDataService);
    serviceService = TestBed.inject(ServiceService) as jasmine.SpyObj<ServiceService>;
    typeService = TestBed.inject(TypeService) as jasmine.SpyObj<TypeService>;
    placeService = TestBed.inject(PlaceService) as jasmine.SpyObj<PlaceService>;
    addressService = TestBed.inject(AddressService) as jasmine.SpyObj<AddressService>;
    regionService = TestBed.inject(RegionService) as jasmine.SpyObj<RegionService>;
    loggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllDropdownData', () => {
    beforeEach(() => {
      serviceService.list.and.returnValue(Promise.resolve(mockServices));
      typeService.list.and.returnValue(Promise.resolve(mockTypes));
      placeService.list.and.returnValue(Promise.resolve(mockPlaces));
      addressService.list.and.returnValue(Promise.resolve(mockAddresses));
      regionService.list.and.returnValue(Promise.resolve(mockRegions));
    });

    it('should fetch and return all dropdown data', async () => {
      const data = await service.getAllDropdownData();

      expect(data.services).toEqual(['DoorDash', 'Uber Eats', 'GrubHub']);
      expect(data.types).toEqual(['Food Delivery', 'Passenger']);
      expect(data.places).toEqual(['McDonald\'s', 'Walmart']);
      expect(data.addresses).toEqual(['123 Main St', '456 Oak Ave']);
      expect(data.regions).toEqual(['Downtown', 'Suburbs']);
    });

    it('should call all service list methods', async () => {
      await service.getAllDropdownData();

      expect(serviceService.list).toHaveBeenCalled();
      expect(typeService.list).toHaveBeenCalled();
      expect(placeService.list).toHaveBeenCalled();
      expect(addressService.list).toHaveBeenCalled();
      expect(regionService.list).toHaveBeenCalled();
    });

    it('should cache the data after first fetch', async () => {
      const data1 = await service.getAllDropdownData();
      const data2 = await service.getAllDropdownData();

      expect(data1).toBe(data2);
      expect(serviceService.list).toHaveBeenCalledTimes(1);
      expect(typeService.list).toHaveBeenCalledTimes(1);
    });

    it('should handle empty lists', async () => {
      serviceService.list.and.returnValue(Promise.resolve([]));
      typeService.list.and.returnValue(Promise.resolve([]));
      placeService.list.and.returnValue(Promise.resolve([]));
      addressService.list.and.returnValue(Promise.resolve([]));
      regionService.list.and.returnValue(Promise.resolve([]));

      const data = await service.getAllDropdownData();

      expect(data.services).toEqual([]);
      expect(data.types).toEqual([]);
      expect(data.places).toEqual([]);
      expect(data.addresses).toEqual([]);
      expect(data.regions).toEqual([]);
    });
  });

  describe('getDropdownList', () => {
    beforeEach(() => {
      serviceService.list.and.returnValue(Promise.resolve(mockServices));
      typeService.list.and.returnValue(Promise.resolve(mockTypes));
      placeService.list.and.returnValue(Promise.resolve(mockPlaces));
      addressService.list.and.returnValue(Promise.resolve(mockAddresses));
      regionService.list.and.returnValue(Promise.resolve(mockRegions));
    });

    it('should return services list', async () => {
      const list = await service.getDropdownList('Service');
      expect(list).toEqual(['DoorDash', 'Uber Eats', 'GrubHub']);
    });

    it('should return types list', async () => {
      const list = await service.getDropdownList('Type');
      expect(list).toEqual(['Food Delivery', 'Passenger']);
    });

    it('should return places list', async () => {
      const list = await service.getDropdownList('Place');
      expect(list).toEqual(['McDonald\'s', 'Walmart']);
    });

    it('should return addresses list', async () => {
      const list = await service.getDropdownList('Address');
      expect(list).toEqual(['123 Main St', '456 Oak Ave']);
    });

    it('should return regions list', async () => {
      const list = await service.getDropdownList('Region');
      expect(list).toEqual(['Downtown', 'Suburbs']);
    });

    it('should return empty array for invalid type', async () => {
      const list = await service.getDropdownList('Invalid' as DropdownType);
      expect(list).toEqual([]);
    });
  });

  describe('filterDropdown', () => {
    beforeEach(() => {
      serviceService.list.and.returnValue(Promise.resolve(mockServices));
      typeService.list.and.returnValue(Promise.resolve(mockTypes));
      placeService.list.and.returnValue(Promise.resolve(mockPlaces));
      addressService.list.and.returnValue(Promise.resolve(mockAddresses));
      regionService.list.and.returnValue(Promise.resolve(mockRegions));
    });

    it('should filter services by search term', async () => {
      const result = await service.filterDropdown('Service', 'door');
      expect(result).toEqual(['DoorDash']);
    });

    it('should be case-insensitive', async () => {
      const result = await service.filterDropdown('Service', 'UBER');
      expect(result).toEqual(['Uber Eats']);
    });

    it('should return all items when search term is empty', async () => {
      const result = await service.filterDropdown('Service', '');
      expect(result).toEqual(['DoorDash', 'Uber Eats', 'GrubHub']);
    });

    it('should return empty array when no matches', async () => {
      const result = await service.filterDropdown('Service', 'xyz123');
      expect(result).toEqual([]);
    });

    it('should match partial strings', async () => {
      const result = await service.filterDropdown('Type', 'food');
      expect(result).toEqual(['Food Delivery']);
    });

    it('should filter places', async () => {
      const result = await service.filterDropdown('Place', 'wal');
      expect(result).toEqual(['Walmart']);
    });

    it('should filter addresses', async () => {
      const result = await service.filterDropdown('Address', 'main');
      expect(result).toEqual(['123 Main St']);
    });

    it('should filter regions', async () => {
      const result = await service.filterDropdown('Region', 'down');
      expect(result).toEqual(['Downtown']);
    });
  });

  describe('findBestMatch', () => {
    const testList = ['DoorDash', 'Uber Eats', 'GrubHub', 'McDonald\'s'];

    it('should find exact match', () => {
      const result = service.findBestMatch('DoorDash', testList);
      expect(result).toBe('DoorDash');
    });

    it('should find case-insensitive match', () => {
      const result = service.findBestMatch('doordash', testList);
      expect(result).toBe('DoorDash');
    });

    it('should find match ignoring apostrophes', () => {
      const result = service.findBestMatch('McDonalds', testList);
      expect(result).toBe('McDonald\'s');
    });

    it('should find match ignoring extra spaces', () => {
      const result = service.findBestMatch('Uber  Eats', testList);
      expect(result).toBe('Uber Eats');
    });

    it('should find partial match', () => {
      const result = service.findBestMatch('Door', testList);
      expect(result).toBe('DoorDash');
    });

    it('should return proper case when no match', () => {
      const result = service.findBestMatch('new service', testList);
      expect(result).toBe('New Service');
    });

    it('should handle empty string', () => {
      const result = service.findBestMatch('', testList);
      expect(result).toBe('');
    });

    it('should handle punctuation differences', () => {
      const result = service.findBestMatch('mcdonalds!!!', testList);
      expect(result).toBe('McDonald\'s');
    });

    it('should convert single word to proper case when no match', () => {
      const result = service.findBestMatch('walmart', testList);
      expect(result).toBe('Walmart');
    });

    it('should convert multiple words to title case when no match', () => {
      const result = service.findBestMatch('taco bell', testList);
      expect(result).toBe('Taco Bell');
    });

    it('should log debug messages for exact matches', () => {
      service.findBestMatch('DoorDash', testList);
      expect(loggerService.debug).toHaveBeenCalled();
    });

    it('should log debug messages for partial matches', () => {
      service.findBestMatch('Door', testList);
      expect(loggerService.debug).toHaveBeenCalled();
    });

    it('should log debug messages for no matches', () => {
      service.findBestMatch('xyz123', testList);
      expect(loggerService.debug).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    beforeEach(() => {
      serviceService.list.and.returnValue(Promise.resolve(mockServices));
      typeService.list.and.returnValue(Promise.resolve(mockTypes));
      placeService.list.and.returnValue(Promise.resolve(mockPlaces));
      addressService.list.and.returnValue(Promise.resolve(mockAddresses));
      regionService.list.and.returnValue(Promise.resolve(mockRegions));
    });

    it('should clear cached data', async () => {
      await service.getAllDropdownData();
      expect(serviceService.list).toHaveBeenCalledTimes(1);

      service.clearCache();
      await service.getAllDropdownData();

      expect(serviceService.list).toHaveBeenCalledTimes(2);
    });

    it('should allow re-fetching after cache clear', async () => {
      const data1 = await service.getAllDropdownData();
      service.clearCache();
      const data2 = await service.getAllDropdownData();

      expect(data1).not.toBe(data2);
      expect(data1).toEqual(data2);
    });
  });

  describe('loadCanonicalLists', () => {
    it('should attempt to load canonical lists on construction', () => {
      expect(window.fetch).toHaveBeenCalled();
    });

    it('should log info when canonical lists loaded successfully', async () => {
      // Service is already constructed and fetch was called
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check that logger was called (timing may vary)
      expect(loggerService.info).toHaveBeenCalled();
    });
  });
});
