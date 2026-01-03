import { IShift } from '@interfaces/shift.interface';
import { DateHelper } from '@helpers/date.helper';

export class ShiftCreationHelper {
    /**
     * Creates a new shift with default values
     * @param date Optional date for the shift, defaults to today
     * @returns A new IShift object with default values
     */
    static createDefaultShift(date?: string): IShift {
        const shiftDate = date || DateHelper.getDateISO(new Date());

        const shift: IShift = {
            key: DateHelper.getDateKey(new Date(shiftDate)),
            rowId: 0,
            date: shiftDate,
            start: '',
            finish: '',
            time: '',
            active: '',
            totalActive: '',
            totalTime: '',
            region: '',
            service: '',
            number: 0,
            trips: 0,
            totalTrips: 0,
            distance: 0,
            totalDistance: 0,
            pay: 0,
            totalPay: 0,
            tip: 0,
            totalTips: 0,
            bonus: 0,
            totalBonus: 0,
            cash: 0,
            totalCash: 0,
            total: 0,
            grandTotal: 0,
            amountPerTime: 0,
            amountPerTrip: 0,
            amountPerDistance: 0,
            note: '',
            omit: false,
            saved: false,
            action: '',
            actionTime: 0
        };

        return shift;
    }

    /**
     * Validates if a shift has the minimum required data
     * @param shift The shift to validate
     * @returns True if shift is valid, false otherwise
     */
    static isValidShift(shift: IShift): boolean {
        return !!(shift.date && shift.key);
    }

    /**
     * Generates a unique key for a shift based on date
     * @param date The date for the shift
     * @returns A unique key string
     */
    static generateShiftKey(date: Date): string {
        return DateHelper.getDateKey(date);
    }
}
