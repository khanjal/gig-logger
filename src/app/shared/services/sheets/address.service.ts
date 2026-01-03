import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IAddress } from '@interfaces/address.interface';
import { GenericCrudService } from '@services/generic-crud.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AddressService extends GenericCrudService<IAddress> {
    constructor() {
      super(spreadsheetDB.addresses); // Pass the table reference
    }

    addresses$ = liveQuery(() => spreadsheetDB.addresses.toArray());

    public async deleteUnsaved() {
        let addresses = await this.getUnsaved();
        addresses.forEach(async address => {
            await this.delete(address.id!);
        });
    }

    public async getUnsaved(): Promise<IAddress[]> {
        return (await this.list()).filter(x => !x.saved);
    }

    public async append(addresses: IAddress[]) {
        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];
            const existingAddress = await this.find('address', address.address);

            if (existingAddress) {
                // Accumulate new address values into existing address
                existingAddress.bonus += address.bonus;
                existingAddress.cash += address.cash;
                existingAddress.pay += address.pay;
                existingAddress.tip += address.tip;
                existingAddress.total += address.total;
                existingAddress.trips += address.trips;

                if (!existingAddress.names) {
                    existingAddress.names = [];
                }

                if (address.names) {
                    existingAddress.names.push(...address.names);
                }

                if (!existingAddress.notes) {
                    existingAddress.notes = [];
                }

                if (address.notes) {
                    existingAddress.notes.push(...address.notes);
                }

                // Replace with merged address
                addresses[i] = existingAddress;
            }
            else {
                address.id = undefined;
            }
        }

        await spreadsheetDB.addresses.bulkPut(addresses);
    }
}