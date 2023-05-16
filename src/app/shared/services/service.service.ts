import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IService } from '@interfaces/service.interface';

export class ServiceService {
    services$ = liveQuery(() => spreadsheetDB.services.toArray());
    
    public async filterRemoteServices(service: string): Promise<IService[]> {
        return await spreadsheetDB.services.where("service").startsWithAnyOfIgnoreCase(service).toArray();
    }

    public async getRemoteServices(): Promise<IService[]> {
        return await spreadsheetDB.services.toArray();
    }

    public async loadServices(services: IService[]) {
        await spreadsheetDB.services.clear();
        await spreadsheetDB.services.bulkAdd(services);
    }

    public async updateServices(services: IService[]) {
        let remoteServices = await this.getRemoteServices();

        services.forEach(async service => {
            let remoteService = remoteServices.find(x => x.service === service.service);

            if (remoteService) {
                console.log(remoteService);
                service.id = remoteService.id;
                service.bonus += remoteService.bonus;
                service.cash += remoteService.cash;
                service.pay += remoteService.pay;
                service.tip += remoteService.tip;
                service.total += remoteService.total;
                service.visits += remoteService.visits;
            }
            else {
                service.id = undefined;
            }
        });

        await spreadsheetDB.services.bulkPut(services);
    }
}