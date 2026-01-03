import { TestBed } from '@angular/core/testing';
import { AddressService } from './address.service';
import { IAddress } from '@interfaces/address.interface';
import { spreadsheetDB } from '@data/spreadsheet.db';

describe('AddressService', () => {
  let service: AddressService;

  const makeAddress = (overrides: Partial<IAddress> = {}): IAddress => ({
    id: overrides.id ?? 1,
    rowId: overrides.rowId ?? 1,
    saved: overrides.saved ?? true,
    address: overrides.address ?? '123 Main St',
    names: overrides.names ?? [],
    notes: overrides.notes ?? [],
    trips: overrides.trips ?? 5,
    firstTrip: overrides.firstTrip ?? '2024-01-01',
    lastTrip: overrides.lastTrip ?? '2024-12-01',
    pay: overrides.pay ?? 50,
    tip: overrides.tip ?? 10,
    bonus: overrides.bonus ?? 0,
    cash: overrides.cash ?? 0,
    total: overrides.total ?? 60,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AddressService],
    });

    service = TestBed.inject(AddressService);

    // Mock Dexie methods - create proper chainable mocks
    spyOn(spreadsheetDB.addresses, 'toArray').and.resolveTo([]);
    spyOn(spreadsheetDB.addresses, 'delete').and.resolveTo();
    spyOn(spreadsheetDB.addresses, 'bulkPut').and.resolveTo(1);
    spyOn(spreadsheetDB.addresses, 'add').and.resolveTo(1);
    
    // Mock where() to return proper chain - will be overridden per test
    spyOn(spreadsheetDB.addresses, 'where').and.returnValue({
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

  it('lists all addresses', async () => {
    const addresses = [
      makeAddress({ id: 1, address: '123 Main St' }),
      makeAddress({ id: 2, address: '456 Oak Ave' })
    ];
    (spreadsheetDB.addresses.toArray as jasmine.Spy).and.resolveTo(addresses);

    const result = await service.list();

    expect(result.length).toBe(2);
    expect(result[0].address).toBe('123 Main St');
  });

  it('gets address by id', async () => {
    const address = makeAddress({ id: 5 });
    (spreadsheetDB.addresses.where as jasmine.Spy).and.returnValue({
      equals: jasmine.createSpy('equals').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(address)
      })
    } as any);

    const result = await service.get(5);

    expect(result).toEqual(address);
    expect(spreadsheetDB.addresses.where).toHaveBeenCalled();
  });

  it('finds address by field value', async () => {
    const address = makeAddress({ address: '789 Elm St' });
    (spreadsheetDB.addresses.where as jasmine.Spy).and.returnValue({
      anyOfIgnoreCase: jasmine.createSpy('anyOfIgnoreCase').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(address)
      })
    } as any);

    const result = await service.find('address', '789 Elm St');

    expect(result).toEqual(address);
  });

  it('filters addresses by field', async () => {
    const addresses = [makeAddress({ address: '123 Main' }), makeAddress({ address: '123 Oak' })];
    (spreadsheetDB.addresses.where as jasmine.Spy).and.returnValue({
      startsWithAnyOfIgnoreCase: jasmine.createSpy('startsWithAnyOfIgnoreCase').and.returnValue({
        toArray: jasmine.createSpy('toArray').and.resolveTo(addresses)
      })
    } as any);

    const result = await service.filter('address', '123');

    expect(result.length).toBe(2);
  });

  it('deletes address by id', async () => {
    await service.delete(1);

    expect(spreadsheetDB.addresses.delete).toHaveBeenCalledWith(1);
  });

  it('adds new address', async () => {
    const address = makeAddress({ id: undefined });

    await service.add(address);

    expect(spreadsheetDB.addresses.add).toHaveBeenCalledWith(address);
  });

  it('deletes unsaved addresses', async () => {
    const unsaved = makeAddress({ id: 5, saved: false });
    const saved = makeAddress({ id: 3, saved: true });
    (spreadsheetDB.addresses.toArray as jasmine.Spy).and.resolveTo([unsaved, saved]);

    await service.deleteUnsaved();

    expect(spreadsheetDB.addresses.delete).toHaveBeenCalledWith(5);
  });

  it('returns unsaved addresses only', async () => {
    const unsaved1 = makeAddress({ id: 5, saved: false });
    const unsaved2 = makeAddress({ id: 6, saved: false });
    const saved = makeAddress({ id: 3, saved: true });
    (spreadsheetDB.addresses.toArray as jasmine.Spy).and.resolveTo([unsaved1, unsaved2, saved]);

    const result = await service.getUnsaved();

    expect(result.length).toBe(2);
    expect(result.every(a => !a.saved)).toBeTrue();
  });

  it('appends addresses and merges duplicates', async () => {
    const existingAddress = makeAddress({
      id: 1,
      address: '123 Main St',
      pay: 100,
      tip: 20,
      trips: 5,
      names: ['John']
    });
    const newAddress = makeAddress({
      id: undefined,
      address: '123 Main St',
      pay: 50,
      tip: 10,
      trips: 3,
      names: ['Jane']
    });

    // Use callFake to return fresh chain for each where() call
    (spreadsheetDB.addresses.where as jasmine.Spy).and.callFake(() => ({
      anyOfIgnoreCase: jasmine.createSpy('anyOfIgnoreCase').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(existingAddress)
      })
    }));

    await service.append([newAddress]);

    expect(spreadsheetDB.addresses.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.addresses.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    // Should merge: existing + new values
    expect(putArg[0].pay).toBe(150); // 100 + 50
    expect(putArg[0].tip).toBe(30); // 20 + 10
    expect(putArg[0].names).toContain('John');
    expect(putArg[0].names).toContain('Jane');
  });

  it('appends new addresses without duplicates', async () => {
    const newAddress = makeAddress({
      id: undefined,
      address: '999 New St',
      pay: 25,
      tip: 5
    });

    (spreadsheetDB.addresses.where as jasmine.Spy).and.returnValue({
      anyOfIgnoreCase: jasmine.createSpy('anyOfIgnoreCase').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(undefined)
      })
    } as any);

    await service.append([newAddress]);

    expect(spreadsheetDB.addresses.bulkPut).toHaveBeenCalled();
    const putArg = (spreadsheetDB.addresses.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    expect(putArg[0].id).toBeUndefined(); // New address, no id
    expect(putArg[0].address).toBe('999 New St');
  });

  it('handles bulk append of multiple addresses', async () => {
    const addr1 = makeAddress({ id: undefined, address: 'A' });
    const addr2 = makeAddress({ id: undefined, address: 'B' });
    const addr3 = makeAddress({ id: undefined, address: 'C' });

    (spreadsheetDB.addresses.where as jasmine.Spy).and.returnValue({
      anyOfIgnoreCase: jasmine.createSpy('anyOfIgnoreCase').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(undefined)
      })
    } as any);

    await service.append([addr1, addr2, addr3]);

    expect(spreadsheetDB.addresses.bulkPut).toHaveBeenCalled();
  });

  it('accumulates notes when merging duplicate addresses', async () => {
    const existingAddress = makeAddress({
      id: 1,
      address: '123 Main St',
      notes: [{ date: '2024-01-01', text: 'Gated' }]
    });
    const newAddress = makeAddress({
      id: undefined,
      address: '123 Main St',
      notes: [{ date: '2024-01-02', text: 'Dogs' }]
    });

    // Use callFake to return fresh chain for each where() call
    (spreadsheetDB.addresses.where as jasmine.Spy).and.callFake(() => ({
      anyOfIgnoreCase: jasmine.createSpy('anyOfIgnoreCase').and.returnValue({
        first: jasmine.createSpy('first').and.resolveTo(existingAddress)
      })
    }));

    await service.append([newAddress]);

    const putArg = (spreadsheetDB.addresses.bulkPut as jasmine.Spy).calls.mostRecent().args[0];
    // Should merge notes from both addresses
    expect(putArg[0].notes.length).toBe(2);
  });

  it('queries addresses by field and value', async () => {
    const addresses = [makeAddress({ id: 1, rowId: 10 })];
    (spreadsheetDB.addresses.where as jasmine.Spy).and.returnValue({
      equals: jasmine.createSpy('equals').and.returnValue({
        toArray: jasmine.createSpy('toArray').and.resolveTo(addresses)
      })
    } as any);

    const result = await service.query('rowId', 10);

    expect(result.length).toBe(1);
    expect(spreadsheetDB.addresses.where).toHaveBeenCalled();
  });
});
