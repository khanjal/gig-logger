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

    public async loadPlaces(places: IPlace[]) {
        await spreadsheetDB.places.clear();
        await spreadsheetDB.places.bulkAdd(places);
    }

    public async getRemotePlace(place: string): Promise<IPlace | undefined> {
        return await spreadsheetDB.places.where("place").anyOfIgnoreCase(place).first();
    }

    public async queryRemotePlaces(field: string, value: string | number): Promise<IPlace[]> {
        return await spreadsheetDB.places.where(field).equals(value).toArray();
    }

    public async update(place: IPlace) {
        await spreadsheetDB.places.put(place);
    }

    public async updatePlaces(places: IPlace[]) {
        let remotePlaces = await this.getRemotePlaces();

        places.forEach(place => {
            let remotePlace = remotePlaces.find(x => x.place === place.place);

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