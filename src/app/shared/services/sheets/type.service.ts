import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IType } from '@interfaces/type.interface';
import { GenericCrudService } from '@services/generic-crud.service';

export class TypeService extends GenericCrudService<IType> {
    constructor() {
      super(spreadsheetDB.types); // Pass the table reference
    }
    
    services$ = liveQuery(() => spreadsheetDB.services.toArray());
   
    public async deleteUnsaved() {
        let types = await this.getUnsaved();
        types.forEach(async type => {
            await spreadsheetDB.types.delete(type.id!);
        });
    }

    public async getUnsaved(): Promise<IType[]> {
        return (await this.list()).filter(x => !x.saved);
    }

    public async append(types: IType[]) {
        let items = await this.list();

        types.forEach(async item => {
            let foundItem = items.find(x => x.type === item.type);

            if (foundItem) {
                console.log(foundItem);
                item.id = foundItem.id;
                item.bonus += foundItem.bonus;
                item.cash += foundItem.cash;
                item.pay += foundItem.pay;
                item.tip += foundItem.tip;
                item.total += foundItem.total;
                item.visits += foundItem.visits;
            }
            else {
                item.id = undefined;
            }
        });

        await spreadsheetDB.types.bulkPut(types);
    }
}