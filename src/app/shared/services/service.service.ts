import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ServiceModel } from '@models/service.model';
import { IService } from '@interfaces/service.interface';

export class ServiceService {
    services$ = liveQuery(() => spreadsheetDB.services.toArray());
    
    public async getRemoteServices(): Promise<IService[]> {
        return await spreadsheetDB.services.toArray();
    }


    public async loadServices(services: ServiceModel[]) {
        await spreadsheetDB.services.clear();
        await spreadsheetDB.services.bulkAdd(services);
    }
}