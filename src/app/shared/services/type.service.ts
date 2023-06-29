import { liveQuery } from 'dexie';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { IType } from '@interfaces/type.interface';

export class TypeService {
    services$ = liveQuery(() => spreadsheetDB.services.toArray());
    
    public async filter(type: string): Promise<IType[]> {
        return await spreadsheetDB.types.where("type").startsWithAnyOfIgnoreCase(type).toArray();
    }

    public async get(): Promise<IType[]> {
        return await spreadsheetDB.types.toArray();
    }

    public async load(types: IType[]) {
        await spreadsheetDB.types.clear();
        await spreadsheetDB.types.bulkAdd(types);
    }

    public async update(types: IType[]) {
        let items = await this.get();

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