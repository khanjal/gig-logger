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
        let existingAddresses = await this.list();

        for (let address of addresses) {
            let remoteAddress = existingAddresses.find(x => x.address === address.address);

            if (remoteAddress) {
                address.id = remoteAddress.id;
                address.bonus += remoteAddress.bonus;
                address.cash += remoteAddress.cash;
                address.pay += remoteAddress.pay;
                address.tip += remoteAddress.tip;
                address.total += remoteAddress.total;
                address.visits += remoteAddress.visits;

                if (!address.names) {
                    address.names = [];
                }

                if (remoteAddress.names) {
                    address.names.push(...remoteAddress.names);
                }

                if (!address.notes) {
                    address.notes = [];
                }

                if (remoteAddress.notes) {
                    address.notes.push(...remoteAddress.notes);
                }
            }
            else {
                address.id = undefined;
            }

        };

        await spreadsheetDB.addresses.bulkPut(addresses);
    }
}