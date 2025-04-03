import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IPlace } from '@interfaces/place.interface';
import { GenericCrudService } from '@services/generic-crud.service';

export class PlaceService extends GenericCrudService<IPlace> {
    constructor() {
      super(spreadsheetDB.places); // Pass the table reference
    }
    
    places$ = liveQuery(() => spreadsheetDB.places.toArray());

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
                place.trips += remotePlace.trips;
            }
            else {
                place.id = undefined;
            }
        });

        await spreadsheetDB.places.bulkPut(places);
    }
}