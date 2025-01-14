import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IService } from '@interfaces/service.interface';

export class ServiceService {
    services$ = liveQuery(() => spreadsheetDB.services.toArray());
    
    public async filterServices(service: string): Promise<IService[]> {
        return await spreadsheetDB.services.where("service").startsWithAnyOfIgnoreCase(service).toArray();
    }

    public async getServices(): Promise<IService[]> {
        return await spreadsheetDB.services.toArray();
    }

    public async loadServices(services: IService[]) {
        await spreadsheetDB.services.clear();
        await spreadsheetDB.services.bulkAdd(services);
    }

    public async updateServices(services: IService[]) {
        let existingServices = await this.getServices();

        services.forEach(async service => {
            let existingService = existingServices.find(x => x.service === service.service);

            if (existingService) {
                console.log(existingService);
                service.id = existingService.id;
                service.bonus += existingService.bonus;
                service.cash += existingService.cash;
                service.pay += existingService.pay;
                service.tip += existingService.tip;
                service.total += existingService.total;
                service.visits += existingService.visits;
            }
            else {
                service.id = undefined;
            }
        });

        await spreadsheetDB.services.bulkPut(services);
    }
}