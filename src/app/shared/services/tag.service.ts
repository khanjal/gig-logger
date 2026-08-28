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
     * Every distinct tag across trips and shifts, most-used first then alphabetical.
     *
     * Frequency order matters more than it looks: a driver's handful of habitual tags should be the
     * first thing offered, ahead of a one-off typed months ago.
     */
    public async getAllTags(): Promise<string[]> {
        const [trips, shifts] = await Promise.all([
            spreadsheetDB.trips.toArray(),
            spreadsheetDB.shifts.toArray(),
        ]);

        const counts = new Map<string, { display: string; count: number }>();

        for (const tags of [...trips, ...shifts].map(row => SheetSerializerHelper.parseTags(row?.tags))) {
            for (const tag of tags) {
                // Case-insensitive grouping so "Rain" and "rain" are one suggestion, but keep the
                // first spelling seen rather than forcing a casing on the user.
                const key = tag.toLowerCase();
                const existing = counts.get(key);

                if (existing) {
                    existing.count += 1;
                } else {
                    counts.set(key, { display: tag, count: 1 });
                }
            }
        }

        return [...counts.values()]
            .sort((a, b) => b.count - a.count || a.display.localeCompare(b.display))
            .map(entry => entry.display);
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
