import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IAddress } from '@interfaces/address.interface';

export class AddressService {
    addresses$ = liveQuery(() => spreadsheetDB.addresses.toArray());

    public async filterRemoteAddress(address: string): Promise<IAddress[]> {
        return await spreadsheetDB.addresses.where("address").startsWithAnyOfIgnoreCase(address).toArray();
    }

    public async findRemoteAddress(address: string): Promise<IAddress | undefined> {
        return await spreadsheetDB.addresses.where("address").anyOfIgnoreCase(address).first();
    }

    public async getRemoteAddress(address: string): Promise<IAddress | undefined> {
        return await spreadsheetDB.addresses.where("address").anyOfIgnoreCase(address).first();
    }

    public async getRemoteAddresses(): Promise<IAddress[]> {
        return await spreadsheetDB.addresses.toArray();
    }
    
    public async loadAddresses(addresses: IAddress[]) {
        await spreadsheetDB.addresses.clear();
        await spreadsheetDB.addresses.bulkAdd(addresses);
    }

    public async update(address: IAddress) {
        await spreadsheetDB.addresses.put(address);
    }

    public async updateAddresses(addresses: IAddress[]) {
        let remoteAddresses = await this.getRemoteAddresses();

        addresses.forEach(async address => {
            let remoteAddress = remoteAddresses.find(x => x.address === address.address);

            if (remoteAddress) {
                address.id = remoteAddress.id;
                address.bonus += remoteAddress.bonus;
                address.cash += remoteAddress.cash;
                address.names.push(...remoteAddress.names);
                address.notes.push(...remoteAddress.notes);
                address.pay += remoteAddress.pay;
                address.tip += remoteAddress.tip;
                address.total += remoteAddress.total;
                address.visits += remoteAddress.visits;
            }
            else {
                address.id = undefined;
            }

        });

        await spreadsheetDB.addresses.bulkPut(addresses);
    }

    public async queryRemoteAddresses(field: string, value: string | number): Promise<IAddress[]> {
        return await spreadsheetDB.addresses.where(field).equals(value).toArray();
    }
}