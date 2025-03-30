import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IName } from '@interfaces/name.interface';
import { GenericCrudService } from '@services/generic-crud.service';

export class NameService extends GenericCrudService<IName> {
    constructor() {
      super(spreadsheetDB.names); // Pass the table reference
    }
      
    names$ = liveQuery(() => spreadsheetDB.names.toArray());
    
    public async deleteUnsaved() {
        let names = await this.getUnsaved();
        names.forEach(async name => {
            await spreadsheetDB.names.delete(name.id!);
        });
    }

    public async getUnsaved(): Promise<IName[]> {
        return (await this.list()).filter(x => !x.saved);
    }

    public async append(names: IName[]) {
        let existingNames = await this.list();

        names.forEach(name => {
            let remoteName = existingNames.find(x => x.name === name.name);

            if (remoteName) {
                name.id = remoteName.id;
                name.bonus += remoteName.bonus;
                name.cash += remoteName.cash;
                name.pay += remoteName.pay;
                name.tip += remoteName.tip;
                name.total += remoteName.total;
                name.visits += remoteName.visits;

                if (!name.addresses) {
                    name.addresses = [];
                }

                if (remoteName.addresses) {
                    name.addresses.push(...remoteName.addresses);
                }

                if (!name.notes) {
                    name.notes = [];
                }

                if (remoteName.notes) {
                    name.notes.push(...remoteName.notes);
                }
            }
            else {
                name.id = undefined;
            }
        });

        await spreadsheetDB.names.bulkPut(names);
    }
}