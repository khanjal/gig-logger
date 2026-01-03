import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IService } from '@interfaces/service.interface';
import { GenericCrudService } from '@services/generic-crud.service';
import { LoggerService } from '../logger.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServiceService extends GenericCrudService<IService> {
    private _logger = new LoggerService();
    
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
        const existingServices = await this.list();

        for (let i = 0; i < services.length; i++) {
            const service = services[i];
            const existingService = existingServices.find(x => x.service === service.service);

            if (existingService) {
                this._logger.debug('Found existing service', existingService);
                // Accumulate new values into existing
                existingService.bonus += service.bonus;
                existingService.cash += service.cash;
                existingService.pay += service.pay;
                existingService.tip += service.tip;
                existingService.total += service.total;
                existingService.trips += service.trips;

                // Replace with merged service
                services[i] = existingService;
            }
            else {
                service.id = undefined;
            }
        }

        await spreadsheetDB.services.bulkPut(services);
    }
}