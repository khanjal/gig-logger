import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { AddressModel } from '@models/address.model';
import { IAddress } from '@interfaces/address.interface';

export class AddressService {
    addresses$ = liveQuery(() => spreadsheetDB.addresses.toArray());

    public async getRemoteAddresses(): Promise<IAddress[]> {
        return await spreadsheetDB.addresses.toArray();
    }
    
    public async loadAddresses(addresses: AddressModel[]) {
        await spreadsheetDB.addresses.clear();
        await spreadsheetDB.addresses.bulkAdd(addresses);
    }
}