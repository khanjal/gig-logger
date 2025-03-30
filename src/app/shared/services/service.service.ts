import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IService } from '@interfaces/service.interface';
import { ICrudService } from '@interfaces/crud-service.interface';

export class ServiceService implements ICrudService<IService> {
    services$ = liveQuery(() => spreadsheetDB.services.toArray());

    // Basic CRUD operations
    public async add(service: IService) {
        await spreadsheetDB.services.add(service);
    }

    public async delete(id: number) {
        await spreadsheetDB.services.delete(id);
    }

    public async filter(service: string): Promise<IService[]> {
        return await spreadsheetDB.services.where("service").startsWithAnyOfIgnoreCase(service).toArray();
    }

    public async find(service: string): Promise<IService | undefined> {
        return await spreadsheetDB.services.where("service").anyOfIgnoreCase(service).first();
    }

    public async get(id: number): Promise<IService | undefined> {
        return await spreadsheetDB.services.where("id").equals(id).first();
    }

    public async list(): Promise<IService[]> {
        return await spreadsheetDB.services.toArray();
    }
    
    public async load(services: IService[]) {
        await spreadsheetDB.services.clear();
        await spreadsheetDB.services.bulkAdd(services);
    }

    public async query(field: string, value: string | number): Promise<IService[]> {
        return await spreadsheetDB.services.where(field).equals(value).toArray();
    }

    public async update(services: IService[]) {
        for (const service of services) {
            await spreadsheetDB.services.put(service);
        }
    }
    
    // Other operations
    public async deleteUnsaved() {
        let services = await this.getUnsaved();
        services.forEach(async service => {
            await spreadsheetDB.services.delete(service.id!);
        });
    }

    public async getUnsaved(): Promise<IService[]> {
        return (await this.list()).filter(x => !x.saved);
    }

    public async bulkUpdate(services: IService[]) {
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
                service.visits += existingService.visits;
            }
            else {
                service.id = undefined;
            }
        });

        await spreadsheetDB.services.bulkPut(services);
    }
}