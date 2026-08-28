import type { ITrip } from '@interfaces/entities/trip.interface';
import type { IShift } from '@interfaces/entities/shift.interface';
import type { ITripSheetRow } from '@interfaces/sheets/trip-sheet-row.interface';
import type { IShiftSheetRow } from '@interfaces/sheets/shift-sheet-row.interface';

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
    public static serializeTrip(trip: ITrip): ITripSheetRow {
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
            // Tags travel as comma-delimited text
            tags: this.formatTags(trip.tags),
            // Calculated fields remain as-is (total, amountPerDistance, amountPerTime)
        } as ITripSheetRow;
    }

    /**
     * Prepares a shift for sheet serialization by converting 0 → null for input fields.
     */
    public static serializeShift(shift: IShift): IShiftSheetRow {
        return {
            ...shift,
            // Input fields: convert 0 → null
            pay: shift.pay === 0 ? null : shift.pay,
            tip: shift.tip === 0 ? null : shift.tip,
            bonus: shift.bonus === 0 ? null : shift.bonus,
            cash: shift.cash === 0 ? null : shift.cash,
            // Tags travel as comma-delimited text
            tags: this.formatTags(shift.tags),
            // Calculated fields remain as-is (total, totalPay, etc.)
        } as IShiftSheetRow;
    }

    /**
     * Splits the sheet's comma-delimited tag text into the array the app works with.
     * Trims whitespace and drops empties, so "rain, , surge," yields ['rain', 'surge'].
     * RaptorSheets stores this column as opaque text and leaves the convention to us.
     */
    public static parseTags(value: unknown): string[] {
        if (Array.isArray(value)) {
            return value.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
        }

        if (typeof value !== 'string') {
            return [];
        }

        return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    /**
     * Joins tags back into the sheet's comma-delimited text. Empty array yields an empty cell
     * rather than a stray separator.
     */
    public static formatTags(tags: string[] | undefined | null): string {
        if (!tags || tags.length === 0) {
            return '';
        }

        return tags.map(tag => tag.trim()).filter(tag => tag.length > 0).join(', ');
    }

    /**
     * Converts a trip as it arrives from the API into the app's shape. Only the tag column needs
     * translating today; everything else already matches.
     */
    public static deserializeTrip(row: ITripSheetRow | ITrip): ITrip {
        return {
            ...row,
            tags: this.parseTags((row as { tags?: unknown }).tags),
        } as ITrip;
    }

    /** @see deserializeTrip */
    public static deserializeShift(row: IShiftSheetRow | IShift): IShift {
        return {
            ...row,
            tags: this.parseTags((row as { tags?: unknown }).tags),
        } as IShift;
    }

    public static deserializeTrips(rows: (ITripSheetRow | ITrip)[]): ITrip[] {
        return rows.map(row => this.deserializeTrip(row));
    }

    public static deserializeShifts(rows: (IShiftSheetRow | IShift)[]): IShift[] {
        return rows.map(row => this.deserializeShift(row));
    }

    /**
     * Serializes all trips in an array.
     */
    public static serializeTrips(trips: ITrip[]): ITripSheetRow[] {
        return trips.map(trip => this.serializeTrip(trip));
    }

    /**
     * Serializes all shifts in an array.
     */
    public static serializeShifts(shifts: IShift[]): IShiftSheetRow[] {
        return shifts.map(shift => this.serializeShift(shift));
    }
}
