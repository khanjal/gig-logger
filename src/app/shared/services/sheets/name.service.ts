import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IName } from '@interfaces/name.interface';
import { GenericCrudService } from '@services/generic-crud.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
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
        const existingNames = await this.list();

        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const remoteName = existingNames.find(x => x.name === name.name);

            if (remoteName) {
                // Accumulate new values into existing
                remoteName.bonus += name.bonus;
                remoteName.cash += name.cash;
                remoteName.pay += name.pay;
                remoteName.tip += name.tip;
                remoteName.total += name.total;
                remoteName.trips += name.trips;

                if (!remoteName.addresses) {
                    remoteName.addresses = [];
                }

                if (name.addresses) {
                    remoteName.addresses.push(...name.addresses);
                }

                if (!remoteName.notes) {
                    remoteName.notes = [];
                }

                if (name.notes) {
                    remoteName.notes.push(...name.notes);
                }

                // Replace with merged name
                names[i] = remoteName;
            }
            else {
                name.id = undefined;
            }
        }

        await spreadsheetDB.names.bulkPut(names);
    }
}