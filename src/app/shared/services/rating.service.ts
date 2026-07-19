import { Injectable } from "@angular/core";
import { spreadsheetDB } from "@data/spreadsheet.db";
import type { IRating } from "@interfaces/entities/rating.interface";
import { liveQuery } from "dexie";

@Injectable({
  providedIn: 'root'
})
export class RatingService {
    public rating$ = liveQuery(() => spreadsheetDB.places.toArray());

    public async getRemoteRatings(): Promise<IRating[]> {
        return await spreadsheetDB.ratings.toArray();
    }

    public async load(ratings: IRating[]) {
        await spreadsheetDB.ratings.clear();
        await spreadsheetDB.ratings.bulkAdd(ratings);
    }
}