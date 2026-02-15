import { TripHelper } from './trip.helper';
import { ITrip } from '@interfaces/trip.interface';
import { IShift } from '@interfaces/shift.interface';
import { TripFormValue } from '@form-types/trip-form.types';
import { ActionEnum } from '@enums/action.enum';

describe('TripHelper', () => {
  describe('createFromFormValue', () => {
    const mockShift: IShift = {
      key: '2024-01-01-1-uber',
      date: '2024-01-01',
      service: 'uber',
      number: 1,
      region: 'downtown',
      active: '09:00',
      finish: '17:00',
      start: '09:00',
      time: '',
      note: 'busy day',
      action: '',
      actionTime: 0,
      rowId: 1,
      saved: false,
      trips: 5,
      distance: 100,
      omit: false,
      totalActive: '08:00:00',
      totalTime: '08:15:00',
      totalTrips: 5,
      totalDistance: 100,
      totalPay: 50,
      totalTips: 5,
      totalBonus: 0,
      grandTotal: 55,
      totalCash: 0,
      pay: 50,
      tip: 5,
      bonus: 0,
      cash: 0,
      total: 55,
      amountPerTrip: 10,
      amountPerDistance: 0.5,
      amountPerTime: 6.25,
    };

    it('should create a new trip with all form values', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        region: 'downtown',
        startAddress: '123 Main St',
        endAddress: '456 Oak Ave',
        endUnit: 'Suite 100',
        distance: 10.5,
        pay: 25.50,
        tip: 5.00,
        bonus: 0,
        cash: 0,
        startOdometer: 1000,
        endOdometer: 1010,
        place: 'downtown_hub',
        name: 'John Doe',
        type: 'Pickup',
        note: 'Good fare',
        orderNumber: 'ABC123',
        pickupTime: '09:00',
        dropoffTime: '09:15',
        exclude: null,
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.key).toBe(mockShift.key);
      expect(result.date).toBe(mockShift.date);
      expect(result.service).toBe(mockShift.service);
      expect(result.number).toBe(mockShift.number);
      expect(result.rowId).toBe(101);
      expect(result.startAddress).toBe('123 Main St');
      expect(result.endAddress).toBe('456 Oak Ave');
      expect(result.endUnit).toBe('Suite 100');
      expect(result.distance).toBe(10.5);
      expect(result.pay).toBe(25.50);
      expect(result.tip).toBe(5.00);
      expect(result.bonus).toBe(0);
      expect(result.cash).toBe(0);
      expect(result.total).toBe(30.50); // 25.50 + 5.00 + 0
      expect(result.startOdometer).toBe(1000);
      expect(result.endOdometer).toBe(1010);
      expect(result.orderNumber).toBe('ABC123');
      expect(result.exclude).toBe(false);
      expect(result.saved).toBe(false);
      expect(result.action).toBe(ActionEnum.Add);
    });

    it('should convert null numeric values to 0', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        pay: null,
        tip: null,
        bonus: null,
        cash: null,
        distance: null,
        startOdometer: null,
        endOdometer: null,
        pickupTime: '09:00',
        dropoffTime: '09:15',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.pay).toBe(0);
      expect(result.tip).toBe(0);
      expect(result.bonus).toBe(0);
      expect(result.cash).toBe(0);
      expect(result.distance).toBe(0);
      expect(result.startOdometer).toBe(0);
      expect(result.endOdometer).toBe(0);
      expect(result.total).toBe(0); // 0 + 0 + 0
    });

    it('should convert empty string numeric values to 0', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        pay: '',
        tip: '',
        bonus: '',
        cash: '',
        distance: '',
        pickupTime: '09:00',
        dropoffTime: '09:15',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.pay).toBe(0);
      expect(result.tip).toBe(0);
      expect(result.bonus).toBe(0);
      expect(result.cash).toBe(0);
      expect(result.distance).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should set default empty strings for string fields', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        pickupTime: '09:00',
        dropoffTime: '09:15',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.region).toBe('');
      expect(result.startAddress).toBe('');
      expect(result.endAddress).toBe('');
      expect(result.endUnit).toBe('');
      expect(result.place).toBe('');
      expect(result.name).toBe('');
      expect(result.type).toBe('');
      expect(result.note).toBe('');
      expect(result.orderNumber).toBe('');
    });

    it('should convert exclude string to boolean', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        exclude: 'true',
        pickupTime: '09:00',
        dropoffTime: '09:15',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.exclude).toBe(true);
    });

    it('should convert orderNumber to uppercase', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        orderNumber: 'abc123',
        pickupTime: '09:00',
        dropoffTime: '09:15',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.orderNumber).toBe('ABC123');
    });

    it('should calculate trip total from pay + tip + bonus', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        pay: 30,
        tip: 5,
        bonus: 2,
        pickupTime: '09:00',
        dropoffTime: '09:15',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.total).toBe(37); // 30 + 5 + 2
    });

    it('should calculate amountPerTime when duration exists', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        pay: 30,
        tip: 0,
        bonus: 0,
        pickupTime: '09:00',
        dropoffTime: '10:00', // 1 hour
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.amountPerTime).toBeDefined();
      expect(result.amountPerTime).toBe(30); // 30 / 1 hour
    });

    it('should calculate amountPerDistance when distance exists', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        pay: 30,
        tip: 0,
        bonus: 0,
        distance: 10,
        pickupTime: '09:00',
        dropoffTime: '09:15',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.amountPerDistance).toBeDefined();
      expect(result.amountPerDistance).toBe(3); // 30 / 10 miles
    });

    it('should not calculate amountPerTime if total is 0', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        pay: 0,
        tip: 0,
        bonus: 0,
        pickupTime: '09:00',
        dropoffTime: '10:00',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.amountPerTime).toBeUndefined();
    });

    xit('should update existing trip with update action', async () => {
      const existingTripObj = { ...mockShift } as unknown as ITrip;
      existingTripObj.id = 123;
      existingTripObj.rowId = 50;
      existingTripObj.region = 'old region';
      existingTripObj.startAddress = 'old address';
      existingTripObj.endAddress = 'old end';
      existingTripObj.endUnit = '';
      existingTripObj.distance = 5;
      existingTripObj.pay = 10;
      existingTripObj.tip = 0;
      existingTripObj.bonus = 0;
      existingTripObj.cash = 0;
      existingTripObj.total = 10;
      existingTripObj.name = 'old name';
      existingTripObj.place = 'old place';
      existingTripObj.type = 'old type';
      existingTripObj.note = 'old note';
      existingTripObj.orderNumber = 'OLD123';
      existingTripObj.pickupTime = '08:00';
      existingTripObj.dropoffTime = '08:30';
      existingTripObj.startOdometer = 500;
      existingTripObj.endOdometer = 505;
      existingTripObj.exclude = false;
      existingTripObj.saved = true;
      existingTripObj.action = ActionEnum.Add;
      existingTripObj.duration = '30m';
      existingTripObj.amountPerTime = 20;
      existingTripObj.amountPerDistance = 2;

      const formValue: TripFormValue = {
        service: 'uber',
        region: 'new region',
        startAddress: 'new start',
        endAddress: 'new end',
        distance: 20,
        pay: 50,
        tip: 10,
        bonus: 5,
        pickupTime: '09:00',
        dropoffTime: '09:30',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, existingTripObj);

      expect(result.id).toBe(123);
      expect(result.rowId).toBe(50); // Keep existing rowId
      expect(result.region).toBe('new region');
      expect(result.startAddress).toBe('new start');
      expect(result.endAddress).toBe('new end');
      expect(result.distance).toBe(20);
      expect(result.pay).toBe(50);
      expect(result.total).toBe(65); // 50 + 10 + 5
      expect(result.action).toBe(ActionEnum.Update);
      expect(result.saved).toBe(false); // Reset to false on update
    });

    it('should throw error when creating new trip without maxRowId', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        pickupTime: '09:00',
        dropoffTime: '09:15',
      };

      await expectAsync(
        TripHelper.createFromFormValue(formValue, mockShift, undefined, undefined)
      ).toBeRejectedWithError('maxRowId is required for new trips');
    });

    it('should handle all payment types combined', async () => {
      const formValue: TripFormValue = {
        service: 'uber',
        pay: 25.50,
        tip: 5.25,
        bonus: 2.50,
        cash: 10.25,
        pickupTime: '09:00',
        dropoffTime: '09:30',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      expect(result.pay).toBe(25.50);
      expect(result.tip).toBe(5.25);
      expect(result.bonus).toBe(2.50);
      expect(result.cash).toBe(10.25);
      expect(result.total).toBe(33.25); // 25.50 + 5.25 + 2.50
    });

    it('should preserve shift properties even if form overrides them', async () => {
      const formValue: TripFormValue = {
        service: 'lyft', // Different from shift service
        region: 'midtown',
        pickupTime: '09:00',
        dropoffTime: '09:15',
      };

      const result = await TripHelper.createFromFormValue(formValue, mockShift, undefined, 100);

      // Shift properties should win for these fields
      expect(result.key).toBe(mockShift.key);
      expect(result.date).toBe(mockShift.date);
      expect(result.service).toBe(mockShift.service); // From shift, not form
      expect(result.number).toBe(mockShift.number);
      // But region comes from form
      expect(result.region).toBe('midtown');
    });
  });
});
