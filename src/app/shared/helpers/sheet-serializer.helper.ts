import { ITrip } from '@interfaces/trip.interface';
import { IShift } from '@interfaces/shift.interface';

/**
 * Helper to prepare data for Google Sheets serialization.
 * Converts 0 values to null for input fields to avoid writing unnecessary zeros to sheets.
 * Preserves calculated fields as-is.
 */
export class SheetSerializerHelper {
    /**
     * Prepares a trip for sheet serialization by converting 0 → null for input fields.
     * Calculated fields (total, amountPerDistance, amountPerTime) are preserved.
     */
    static serializeTrip(trip: ITrip): ITrip {
        return {
            ...trip,
            // Input fields: convert 0 → null
            pay: trip.pay === 0 ? null : trip.pay,
            tip: trip.tip === 0 ? null : trip.tip,
            bonus: trip.bonus === 0 ? null : trip.bonus,
            cash: trip.cash === 0 ? null : trip.cash,
            distance: trip.distance === 0 ? null : trip.distance,
            startOdometer: trip.startOdometer === 0 ? null : trip.startOdometer,
            endOdometer: trip.endOdometer === 0 ? null : trip.endOdometer,
            // Calculated fields remain as-is (total, amountPerDistance, amountPerTime)
        } as ITrip;
    }

    /**
     * Prepares a shift for sheet serialization by converting 0 → null for input fields.
     */
    static serializeShift(shift: IShift): IShift {
        return {
            ...shift,
            // Input fields: convert 0 → null
            pay: shift.pay === 0 ? null : shift.pay,
            tip: shift.tip === 0 ? null : shift.tip,
            bonus: shift.bonus === 0 ? null : shift.bonus,
            cash: shift.cash === 0 ? null : shift.cash,
            // Calculated fields remain as-is (total, totalPay, etc.)
        } as IShift;
    }

    /**
     * Serializes all trips in an array.
     */
    static serializeTrips(trips: ITrip[]): ITrip[] {
        return trips.map(trip => this.serializeTrip(trip));
    }

    /**
     * Serializes all shifts in an array.
     */
    static serializeShifts(shifts: IShift[]): IShift[] {
        return shifts.map(shift => this.serializeShift(shift));
    }
}
