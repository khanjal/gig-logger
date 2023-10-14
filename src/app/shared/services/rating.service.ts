import { spreadsheetDB } from "@data/spreadsheet.db";
import { IRating } from "@interfaces/rating.interface";
import { liveQuery } from "dexie";

export class RatingService {
    rating$ = liveQuery(() => spreadsheetDB.places.toArray());

    public async getRemoteRatings(): Promise<IRating[]> {
        return await spreadsheetDB.ratings.toArray();
    }

    public async load(ratings: IRating[]) {
        await spreadsheetDB.ratings.clear();
        await spreadsheetDB.ratings.bulkAdd(ratings);
    }
}