import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IPlace } from '@interfaces/place.interface';
import { ICrudService } from '@interfaces/crud-service.interface';

export class PlaceService implements ICrudService<IPlace> {
    places$ = liveQuery(() => spreadsheetDB.places.toArray());
    
    // Basic CRUD operations
    public async add(place: IPlace) {
        await spreadsheetDB.places.add(place);
    }

    public async delete(id: number) {
        await spreadsheetDB.places.delete(id);
    }

    public async filter(place: string): Promise<IPlace[]> {
        return await spreadsheetDB.places.where("place").startsWithAnyOfIgnoreCase(place).toArray();
    }

    public async find(place: string): Promise<IPlace | undefined> {
        return await spreadsheetDB.places.where("place").anyOfIgnoreCase(place).first();
    }

    public async get(id: number): Promise<IPlace | undefined> {
        return await spreadsheetDB.places.where("id").equals(id).first();
    }

    public async list(): Promise<IPlace[]> {
        return await spreadsheetDB.places.toArray();
    }
    
    public async load(places: IPlace[]) {
        await spreadsheetDB.places.clear();
        await spreadsheetDB.places.bulkAdd(places);
    }

    public async query(field: string, value: string | number): Promise<IPlace[]> {
        return await spreadsheetDB.places.where(field).equals(value).toArray();
    }

    public async update(places: IPlace[]) {
        for (const place of places) {
            await spreadsheetDB.places.put(place);
        }
    }

    // Other operations
    public async deleteUnsaved() {
        let places = await this.getUnsaved();
        places.forEach(async place => {
            await spreadsheetDB.places.delete(place.id!);
        });
    }

    public async getUnsaved(): Promise<IPlace[]> {
        return (await this.list()).filter(x => !x.saved);
    }

    public async append(places: IPlace[]) {
        let existingPlaces = await this.list();

        places.forEach(place => {
            let remotePlace = existingPlaces.find(x => x.place === place.place);

            if (remotePlace) {
                place.id = remotePlace.id;
                place.addresses.push(...remotePlace.addresses);
                place.bonus += remotePlace.bonus;
                place.cash += remotePlace.cash;
                place.pay += remotePlace.pay;
                place.tip += remotePlace.tip;
                place.total += remotePlace.total;
                place.visits += remotePlace.visits;
            }
            else {
                place.id = undefined;
            }
        });

        await spreadsheetDB.places.bulkPut(places);
    }
}