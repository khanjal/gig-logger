import { ImageScanDialogComponent } from './image-scan-dialog.component';

describe('ImageScanDialogComponent (parsing helpers)', () => {
  let component: ImageScanDialogComponent;

  const mockDialog: any = {
    open: () => ({})
  };

  const mockDialogRef: any = {};

  const mockServiceService: any = {
    list: jasmine.createSpy('list').and.returnValue(Promise.resolve([])),
    find: jasmine.createSpy('find').and.returnValue(Promise.resolve(null)),
    append: jasmine.createSpy('append').and.returnValue(Promise.resolve())
  };

  const mockPlaceService: any = {
    list: jasmine.createSpy('list').and.returnValue(Promise.resolve([])),
    find: jasmine.createSpy('find').and.returnValue(Promise.resolve(null)),
    append: jasmine.createSpy('append').and.returnValue(Promise.resolve())
  };

  beforeEach(() => {
    // instantiate directly with minimal mocks; constructor calls loadDataLists (async) but tests don't depend on it
    component = new ImageScanDialogComponent(mockDialog, mockServiceService, mockPlaceService, mockDialogRef, { url: '' });
  });

  it('extractPlaceAmountPairs should find PetSmart and Dollar General with amounts', () => {
    const text = `PetSmart (2327) $8.25\nDoorDash Pay v $8.25\nCustomer Tips v $0.00\nDollar General (20237) $2.75\nDoorDash Pay v $2.75`;
    const pairs = (component as any).extractPlaceAmountPairs(text) as Array<{ place: string; amount: number }>;

    expect(pairs.length).toBe(2);
    expect(pairs[0].place).toBe('PetSmart');
    expect(pairs[0].amount).toBeCloseTo(8.25, 2);
    expect(pairs[1].place).toBe('Dollar General');
    expect(pairs[1].amount).toBeCloseTo(2.75, 2);
  });

  it('extractPlaceAmountPairs should ignore Base Pay lines', () => {
    const text = `Base Pay $4.50\nSpeedway (45746) $2.00\nChuck Tanner's $4.00`;
    const pairs = (component as any).extractPlaceAmountPairs(text) as Array<{ place: string; amount: number }>;
    expect(pairs.length).toBe(2);
    expect(pairs.map(p => p.place)).not.toContain('Base Pay');
    expect(pairs[0].place).toBe('Speedway');
  });

  it('buildExtractedTrips should not attribute tips when tipAmounts length differs from perOfferAmounts length', () => {
    const input = {
      tripCount: 2,
      places: ['PetSmart', 'Dollar General'],
      completedTime: '7:05',
      fallbackAmount: 11,
      basePay: 11,
      tipAmounts: [2.75], // only one tip extracted (mismatch)
      perOfferAmounts: [8.25, 2.75],
      isEarningsSummary: true
    };

    const trips = (component as any).buildExtractedTrips(input) as any[];
    expect(trips.length).toBe(2);
    expect(trips[0].pay).toBeCloseTo(8.25, 2);
    expect(trips[0].tip).toBeUndefined();
    expect(trips[1].pay).toBeCloseTo(2.75, 2);
    expect(trips[1].tip).toBeUndefined();
  });

  it('buildExtractedTrips should assign per-offer tips when counts align', () => {
    const input = {
      tripCount: 2,
      places: ['PetSmart', 'Dollar General'],
      completedTime: '7:05',
      fallbackAmount: 11,
      basePay: 11,
      tipAmounts: [0.5, 0], // two tips, aligns with per-offer amounts
      perOfferAmounts: [8.25, 2.75],
      isEarningsSummary: true
    };

    const trips = (component as any).buildExtractedTrips(input) as any[];
    expect(trips.length).toBe(2);
    expect(trips[0].pay).toBeCloseTo(8.25, 2);
    expect(trips[0].tip).toBeCloseTo(0.5, 2);
    expect(trips[1].pay).toBeCloseTo(2.75, 2);
    expect(trips[1].tip).toBeUndefined();
  });

  it('extractFields should detect doordash earnings-summary layout and use explicit pairs', () => {
    const text = `DoorDash Pay $11.00\nCustomer Tips $0.00\nPetSmart (2327) $8.25\nDollar General (20237) $2.75`;
    const output = (component as any).extractFields(text) as any;
    expect(output.layout).toBeDefined();
    expect(output.layout.layoutId).toBe('doordash-earnings-summary');
    expect(output.perOfferAmounts).toEqual([8.25, 2.75]);
    expect(output.places).toEqual(['PetSmart', 'Dollar General']);
    expect(output.extractedTrips.length).toBe(2);
    expect(output.extractedTrips[0].pay).toBeCloseTo(8.25, 2);
  });

  it('extractFields should handle multi-line place then amount patterns', () => {
    const text = `DoorDash Pay $5.50\nCustomer Tips\nBill's Sandwich Shop\n(Wilmington Rd) $7.00\nDollar General (9928) $6.50\nTotal $19.00`;
    const output = (component as any).extractFields(text) as any;
    expect(output.layout).toBeDefined();
    expect(output.layout.layoutId).toBe('doordash-earnings-summary');
    expect(output.perOfferAmounts).toEqual([7.00, 6.50]);
    expect(output.places).toEqual(["Bill's Sandwich Shop", 'Dollar General']);
    expect(output.extractedTrips.length).toBe(2);
  });
});
