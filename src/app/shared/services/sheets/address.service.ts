import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IAddress } from '@interfaces/address.interface';
import { ICrudService } from '@interfaces/crud-service.interface';

export class AddressService implements ICrudService<IAddress> {
    addresses$ = liveQuery(() => spreadsheetDB.addresses.toArray());

    // Basic CRUD operations
    public async add(address: IAddress) {
        await spreadsheetDB.addresses.add(address);
    }

    public async delete(id: number) {
        await spreadsheetDB.addresses.delete(id);
    }

    public async filter(address: string): Promise<IAddress[]> {
        return await spreadsheetDB.addresses.where("address").startsWithAnyOfIgnoreCase(address).toArray();
    }

    public async find(address: string): Promise<IAddress | undefined> {
        return await spreadsheetDB.addresses.where("address").anyOfIgnoreCase(address).first();
    }

    public async get(id: number): Promise<IAddress | undefined> {
        return await spreadsheetDB.addresses.where("id").equals(id).first();
    }

    public async list(): Promise<IAddress[]> {
        return await spreadsheetDB.addresses.toArray();
    }
    
    public async load(addresses: IAddress[]) {
        await spreadsheetDB.addresses.clear();
        await spreadsheetDB.addresses.bulkAdd(addresses);
    }

    public async query(field: string, value: string | number): Promise<IAddress[]> {
        return await spreadsheetDB.addresses.where(field).equals(value).toArray();
    }

    public async update(addresses: IAddress[]) {
        for (const address of addresses) {
            await spreadsheetDB.addresses.put(address);
        }
    }

    // Other operations
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