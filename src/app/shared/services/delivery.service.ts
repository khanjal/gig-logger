import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IDelivery } from '@interfaces/delivery.interface';

export class DeliveryService {
    names$ = liveQuery(() => spreadsheetDB.deliveries.toArray());

    public async getRemoteDeliveries(): Promise<IDelivery[]> {
        return await spreadsheetDB.deliveries.toArray();
    }

    public async loadDeliveries(deliveries: IDelivery[]) {
        await spreadsheetDB.deliveries.clear();
        await spreadsheetDB.deliveries.bulkAdd(deliveries);
    }

    public async queryRemoteDeliveries(field: string, value: string | number): Promise<IDelivery[]> {
        return await spreadsheetDB.deliveries.where(field).equals(value).toArray();
    }
}