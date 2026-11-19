import { Injectable, inject } from '@angular/core';

import { spreadsheetDB } from '@data/spreadsheet.db';
import { SheetSerializerHelper } from '@helpers/sheet-serializer.helper';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';

/**
 * Supplies the distinct tags already in use, for autocomplete.
 *
 * Unlike Region/Place/Name, tags have no rollup sheet to read from - RaptorSheets stores the column
 * as opaque text and does not aggregate it (see RaptorSheets #126). Suggestions are therefore
 * derived from the local store, which already holds every trip and shift. That costs one pass over
 * local data and, usefully, works offline.
 */
@Injectable({ providedIn: 'root' })
export class TagService {
    private _tripService = inject(TripService);
    private _shiftService = inject(ShiftService);

    /**
     * Every distinct tag across trips and shifts, alphabetically.
     *
     * Ordered by use at first, on the theory that habitual tags should surface first. That was
     * wrong: usage order is unstable, so the list reshuffles as tags are used and a reader can
     * never learn where anything sits. A predictable order is worth more in a list that is scanned
     * repeatedly, and it matches how tags are ordered everywhere else they are shown.
     */
    public async getAllTags(): Promise<string[]> {
        const [trips, shifts] = await Promise.all([
            spreadsheetDB.trips.toArray(),
            spreadsheetDB.shifts.toArray(),
        ]);

        // Case-insensitive keys so "Rain" and "rain" are one suggestion, keeping the first spelling
        // seen rather than imposing a casing on the user. Occurrences were counted here when the
        // list was ranked by use; nothing needs the tally now the order is alphabetical.
        const seen = new Map<string, string>();

        for (const tags of [...trips, ...shifts].map(row => SheetSerializerHelper.parseTags(row?.tags))) {
            for (const tag of tags) {
                const key = tag.toLowerCase();

                if (!seen.has(key)) {
                    seen.set(key, tag);
                }
            }
        }

        return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }

    /**
     * Tags matching what has been typed, excluding any already applied to the row being edited.
     * An empty query returns the full list, so focusing the field shows what is available.
     */
    public async suggest(query: string, exclude: string[] = []): Promise<string[]> {
        const all = await this.getAllTags();
        const taken = new Set(exclude.map(tag => tag.toLowerCase()));
        const needle = query.trim().toLowerCase();

        return all
            .filter(tag => !taken.has(tag.toLowerCase()))
            .filter(tag => needle.length === 0 || tag.toLowerCase().includes(needle));
    }
}
