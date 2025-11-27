import { ICrudService } from "@interfaces/crud-service.interface";
import { Table } from "dexie";

export class GenericCrudService<T> implements ICrudService<T> {
  constructor(private table: Table<T, number>) {}

    public async add(item: T): Promise<void> {
        await this.table.add(item);
    }

    public async delete(id: number) {
        await this.table.delete(id);
    }

    public async filter(field: string, value: string): Promise<T[]> {
        return await this.table.where(field).startsWithAnyOfIgnoreCase(value).toArray();
    }

    public async find(field: string, value: string): Promise<T | undefined> {
        return await this.table.where(field).anyOfIgnoreCase(value).first();
    }

    public async get(id: number): Promise<T | undefined> {
        return await this.table.where("id").equals(id).first();
    }

    public async getByRowId(rowId: number): Promise<T | undefined> {
        return await this.table.where("rowId").equals(rowId).first();
    }

    public async includes(field: keyof T, value: string): Promise<T[]> {
        const allItems = await this.table.toArray();
        return allItems.filter(item => {
            const fieldValue = item[field];
            if (typeof fieldValue === "string") {
                return fieldValue.toLocaleLowerCase().includes(value.toLocaleLowerCase());
            }
            return false;
        });
    }

    // Get all items
    public async list(): Promise<T[]> {
        return await this.table.toArray();
    }

    // Load multiple items into the table
    public async load(items: T[]): Promise<void> {
        await this.table.clear();
        await this.table.bulkAdd(items);
    }

    /**
     * Paginate items in the table.
     * @param page The page number (0-based)
     * @param amount The number of items per page
     * @param sortField Optional field to sort by (default: none)
     * @param direction Optional direction: 'asc' | 'desc' (default: 'asc')
     */
    public async paginate(page: number, amount: number, sortField?: keyof T, direction: 'asc' | 'desc' = 'asc'): Promise<T[]> {
        const offset = page * amount;
        
        if (sortField) {
            // Use Dexie's orderBy with offset and limit
            let collection = this.table.orderBy(sortField as string);
            if (direction === 'desc') {
                collection = collection.reverse();
            }
            return await collection.offset(offset).limit(amount).toArray();
        } else {
            // If no sort field, get all items and slice manually
            const allItems = await this.table.toArray();
            return allItems.slice(offset, offset + amount);
        }
    }

    // Query items by a specific field and value
    public async query(field: string, value: string | number): Promise<T[]> {
        return await this.table.where(field).equals(value).toArray();
    }

    // Update items
    public async update(items: T[]): Promise<void> {
        for (const item of items) {
            await this.table.put(item);
        }
    }
}