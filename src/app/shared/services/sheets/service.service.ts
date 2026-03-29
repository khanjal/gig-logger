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
                // Accumulate new values into existing (treat null as 0)
                existingService.bonus = (existingService.bonus ?? 0) + (service.bonus ?? 0);
                existingService.cash = (existingService.cash ?? 0) + (service.cash ?? 0);
                existingService.pay = (existingService.pay ?? 0) + (service.pay ?? 0);
                existingService.tip = (existingService.tip ?? 0) + (service.tip ?? 0);
                existingService.total = (existingService.total ?? 0) + (service.total ?? 0);
                existingService.trips = (existingService.trips ?? 0) + (service.trips ?? 0);

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