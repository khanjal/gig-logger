import { DateHelper } from '@helpers/date.helper';
import { NumberHelper } from '@helpers/number.helper';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { ActionEnum } from '@enums/action.enum';
import { updateAction } from '@utils/action.utils';
import { TripFormValue } from '@form-types/trip-form.types';

export class TripHelper {
    /**
     * Creates an ITrip entity from form values and shift information.
     * Handles form-to-domain conversion: form allows null, domain uses 0.
     * Calculates derived fields (duration, amountPerTime, amountPerDistance).
     * 
     * @param formValue The trip form values (allows null for numeric inputs)
     * @param shift The associated shift (provides key, date, service, number)
     * @param existingTrip Optional existing trip (for update mode)
     * @param maxRowId The maximum row ID from the database (for new trips)
     * @returns A complete ITrip entity ready for persistence
     * 
     * @example
     * // Create new trip
     * const newTrip = await TripHelper.createFromFormValue(
     *   formValues,
     *   shift,
     *   undefined,
     *   100
     * );
     * 
     * @example
     * // Update existing trip
     * const updated = await TripHelper.createFromFormValue(
     *   formValues,
     *   shift,
     *   existingTrip,
     *   undefined
     * );
     */
    static async createFromFormValue(
        formValue: TripFormValue,
        shift: IShift,
        existingTrip: ITrip | undefined,
        maxRowId?: number
    ): Promise<ITrip> {
        let trip: ITrip = existingTrip ?? ({} as ITrip);

        // Set shift-derived properties
        trip.key = shift.key;
        trip.date = shift.date;
        trip.service = shift.service;
        trip.number = shift.number ?? 0;

        // Set form-derived string properties (default to empty string)
        trip.region = formValue.region ?? '';
        trip.startAddress = formValue.startAddress ?? '';
        trip.endAddress = formValue.endAddress ?? '';
        trip.endUnit = formValue.endUnit ?? '';

        // Convert numeric fields: null/empty → 0
        trip.distance = NumberHelper.toNumber(formValue.distance);

        // Store converted payment values to avoid redundant calls
        const pay = NumberHelper.toNumber(formValue.pay);
        const tip = NumberHelper.toNumber(formValue.tip);
        const bonus = NumberHelper.toNumber(formValue.bonus);
        trip.pay = pay;
        trip.tip = tip;
        trip.bonus = bonus;
        trip.cash = NumberHelper.toNumber(formValue.cash);

        // Total is a calculated field: pay + tip + bonus
        trip.total = pay + tip + bonus;

        // Set odometer readings
        trip.startOdometer = NumberHelper.toNumber(formValue.startOdometer);
        trip.endOdometer = NumberHelper.toNumber(formValue.endOdometer);

        // Set descriptive fields (default to empty string)
        trip.name = formValue.name ?? '';
        trip.place = formValue.place ?? '';
        trip.type = formValue.type ?? '';
        trip.note = formValue.note ?? '';
        trip.orderNumber = formValue.orderNumber?.toLocaleUpperCase() ?? '';
        trip.exclude = formValue.exclude ? true : false;
        trip.saved = false;

        // Handle add/update logic
        if (existingTrip && existingTrip.id !== undefined && existingTrip.id !== null) {
            // Update existing trip
            updateAction(trip, ActionEnum.Update);
            trip.pickupTime = formValue.pickupTime ?? '';
            trip.dropoffTime = formValue.dropoffTime ?? '';
            trip.rowId = existingTrip.rowId;
        } else {
            // Create new trip
            if (maxRowId === undefined) {
                throw new Error('maxRowId is required for new trips');
            }
            trip.rowId = maxRowId + 1;
            updateAction(trip, ActionEnum.Add);
            // Use form times if provided, otherwise empty string (form handles defaults)
            trip.pickupTime = formValue.pickupTime ?? '';
            trip.dropoffTime = formValue.dropoffTime ?? '';
        }

        // Calculate derived time-based fields
        const duration = DateHelper.getDurationSeconds(trip.pickupTime, trip.dropoffTime);
        if (duration) {
            trip.duration = DateHelper.getDurationString(duration);

            // Amount per hour: total divided by hours worked
            if (trip.total && duration) {
                trip.amountPerTime = trip.total / DateHelper.getHoursFromSeconds(duration);
            }
        }

        // Amount per mile: total divided by distance
        if (trip.total && trip.distance) {
            trip.amountPerDistance = trip.total / trip.distance;
        }

        return trip;
    }
}
