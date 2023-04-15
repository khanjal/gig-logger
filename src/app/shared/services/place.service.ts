import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { PlaceModel } from '@models/place.model';
import { IPlace } from '@interfaces/place.interface';

export class PlaceService {
    places$ = liveQuery(() => spreadsheetDB.places.toArray());
    
    public async filterRemotePlaces(place: string): Promise<IPlace[]> {
        return await spreadsheetDB.places.where("place").startsWithAnyOfIgnoreCase(place).toArray();
    }

    public async getRemotePlaces(): Promise<IPlace[]> {
        return await spreadsheetDB.places.toArray();
    }

    public async loadPlaces(places: PlaceModel[]) {
        await spreadsheetDB.places.clear();
        await spreadsheetDB.places.bulkAdd(places);
    }

    public async queryRemotePlaces(field: string, value: string | number): Promise<IPlace[]> {
        return await spreadsheetDB.places.where(field).equals(value).toArray();
    }
}