import { TestBed } from '@angular/core/testing';
import { ServiceService } from './service.service';
import { IService } from '@interfaces/service.interface';
import { spreadsheetDB } from '@data/spreadsheet.db';

describe('ServiceService', () => {
  let service: ServiceService;

  const makeService = (overrides: Partial<IService> = {}): IService => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
    service: overrides.service ?? 'DoorDash',
    trips: overrides.trips ?? 5,
    pay: overrides.pay ?? 50,
    tip: overrides.tip ?? 10,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 60,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServiceService],
    });

    service = TestBed.inject(ServiceService);

    spyOn(spreadsheetDB.services, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.services, 'delete').and.resolveTo();
    spyOn(spreadsheetDB.services, 'bulkPut').and.resolveTo(1);
    spyOn(spreadsheetDB.services, 'add').and.resolveTo(1);
    
    spyOn(spreadsheetDB.services, 'where').and.returnValue({
      equals: jasmine.createSpy('equals').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(undefined),
        toArray: jasmine.createSpy('toArray').and.resolveTo([])
      }),
      anyOfIgnoreCase: jasmine.createSpy('anyOfIgnoreCase').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(undefined)
      }),
      startsWithAnyOfIgnoreCase: jasmine.createSpy('startsWithAnyOfIgnoreCase').and.returnValue({
        toArray: jasmine.createSpy('toArray').and.resolveTo([])
      })
    } as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists all services', async () => {
    const services = [
      makeService({ id: 1, service: 'DoorDash' }),
      makeService({ id: 2, service: 'Uber Eats' })
    ];
    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo(services);

    const result = await service.list();

    expect(result.length).toBe(2);
    expect(result[0].service).toBe('DoorDash');
  });

  it('gets service by id', async () => {
    const svc = makeService({ id: 5 });
    (spreadsheetDB.services.where as jasmine.Spy).and.returnValue({
      equals: jasmine.createSpy('equals').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(svc)
      })
    } as any);

    const result = await service.get(5);

    expect(result).toEqual(svc);
  });

  it('deletes service by id', async () => {
    await service.delete(5);

    expect(spreadsheetDB.services.delete).toHaveBeenCalledWith(5);
  });

  it('deletes unsaved services', async () => {
    const unsaved = makeService({ id: 5, saved: false });
    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo([unsaved]);

    await service.deleteUnsaved();

    expect(spreadsheetDB.services.delete).toHaveBeenCalledWith(5);
  });

  it('returns unsaved services only', async () => {
    const unsaved1 = makeService({ id: 5, saved: false });
    const unsaved2 = makeService({ id: 6, saved: false });
    const saved = makeService({ id: 3, saved: true });
    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo([unsaved1, unsaved2, saved]);

    const result = await service.getUnsaved();

    expect(result.length).toBe(2);
    expect(result.every(s => !s.saved)).toBeTrue();
  });

  it('appends services and merges duplicates', async () => {
    const existingServices = [
      makeService({
        id: 1,
        service: 'DoorDash',
        pay: 100,
        tip: 20,
        trips: 5
      })
    ];
    const newService = makeService({
      id: undefined,
      service: 'DoorDash',
      pay: 50,
      tip: 10,
      trips: 3
    });

    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo(existingServices);

    await service.append([newService]);

    expect(spreadsheetDB.services.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.services.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].id).toBe(1);
    expect(putArg[0].pay).toBe(150);
    expect(putArg[0].tip).toBe(30);
  });

  it('appends new services without duplicates', async () => {
    const newService = makeService({
      id: undefined,
      service: 'Grubhub',
      pay: 25,
      tip: 5
    });

    (spreadsheetDB.services.toArray as jasmine.Spy).and.resolveTo([]);

    await service.append([newService]);

    expect(spreadsheetDB.services.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.services.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].id).toBeUndefined();
    expect(putArg[0].service).toBe('Grubhub');
  });
});
