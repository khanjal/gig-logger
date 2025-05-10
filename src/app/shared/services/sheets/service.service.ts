import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IService } from '@interfaces/service.interface';
import { GenericCrudService } from '@services/generic-crud.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServiceService extends GenericCrudService<IService> {
    constructor() {
      super(spreadsheetDB.services); // Pass the table reference
    }
    
    services$ = liveQuery(() => spreadsheetDB.services.toArray());

    public async deleteUnsaved() {
        let services = await this.getUnsaved();
        services.forEach(async service => {
            await spreadsheetDB.services.delete(service.id!);
        });
    }

    public async getUnsaved(): Promise<IService[]> {
        return (await this.list()).filter(x => !x.saved);
    }

    public async append(services: IService[]) {
        let existingServices = await this.list();

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
                service.trips += existingService.trips;
            }
            else {
                service.id = undefined;
            }
        });

        await spreadsheetDB.services.bulkPut(services);
    }
}