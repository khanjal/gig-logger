import { TestBed } from '@angular/core/testing';
import { DeliveryService } from './delivery.service';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IDelivery } from '@interfaces/delivery.interface';

describe('DeliveryService', () => {
  let service: DeliveryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DeliveryService]
    });
    service = TestBed.inject(DeliveryService);
  });

  afterEach(async () => {
    await spreadsheetDB.deliveries.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('clear', () => {
    it('clears all deliveries from database', async () => {
      await spreadsheetDB.deliveries.add({ address: '123 Main', name: 'John' } as IDelivery);
      
      await service.clear();
      
      const count = await spreadsheetDB.deliveries.count();
      expect(count).toBe(0);
    });
  });

  describe('list', () => {
    it('returns all deliveries from database', async () => {
      const delivery1: IDelivery = { address: '123 Main', name: 'John' } as IDelivery;
      const delivery2: IDelivery = { address: '456 Elm', name: 'Jane' } as IDelivery;
      await spreadsheetDB.deliveries.bulkAdd([delivery1, delivery2]);

      const result = await service.list();

      expect(result.length).toBe(2);
      expect(result[0].address).toBe('123 Main');
      expect(result[1].address).toBe('456 Elm');
    });

    it('returns empty array when no deliveries exist', async () => {
      const result = await service.list();
      
      expect(result).toEqual([]);
    });
  });

  describe('loadDeliveries', () => {
    it('clears existing and loads new deliveries', async () => {
      await spreadsheetDB.deliveries.add({ address: 'old', name: 'Old' } as IDelivery);
      
      const newDeliveries: IDelivery[] = [
        { address: '123 Main', name: 'John' } as IDelivery,
        { address: '456 Elm', name: 'Jane' } as IDelivery
      ];
      

      await service.load(newDeliveries);
      
      const result = await spreadsheetDB.deliveries.toArray();
      expect(result.length).toBe(2);
      expect(result.find(d => d.address === 'old')).toBeUndefined();
      expect(result.find(d => d.address === '123 Main')).toBeDefined();
    });
  });

  describe('queryRemoteDeliveries', () => {
    it('queries deliveries by field and value', async () => {
      const deliveries: IDelivery[] = [
        { address: '123 Main', name: 'John' } as IDelivery,
        { address: '456 Elm', name: 'Jane' } as IDelivery,
        { address: '789 Oak', name: 'John' } as IDelivery
      ];
      await spreadsheetDB.deliveries.bulkAdd(deliveries);

      const result = await service.query('name', 'John');

      expect(result.length).toBe(2);
      expect(result.every(d => d.name === 'John')).toBeTrue();
    });

    it('returns empty array when no matches found', async () => {
      const result = await service.query('name', 'Nonexistent');
      
      expect(result).toEqual([]);
    });
  });
});
