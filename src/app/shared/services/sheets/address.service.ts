import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IAddress } from '@interfaces/address.interface';
import { GenericCrudService } from '@services/generic-crud.service';

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
        for (let address of addresses) {
            let existingAddress = await this.find('address', address.address);

            if (existingAddress) {
                address = existingAddress;
                address.bonus += existingAddress.bonus;
                address.cash += existingAddress.cash;
                address.pay += existingAddress.pay;
                address.tip += existingAddress.tip;
                address.total += existingAddress.total;
                address.visits += existingAddress.visits;

                if (!address.names) {
                    address.names = [];
                }

                if (existingAddress.names) {
                    address.names.push(...existingAddress.names);
                }

                if (!address.notes) {
                    address.notes = [];
                }

                if (existingAddress.notes) {
                    address.notes.push(...existingAddress.notes);
                }
            }
            else {
                address.id = undefined;
            }

        };

        await spreadsheetDB.addresses.bulkPut(addresses);
    }
}