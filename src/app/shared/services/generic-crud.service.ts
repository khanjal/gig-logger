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

    /**
     * Find potential duplicates for a given string field.
     * Supports case-insensitive equality and substring matching with optional normalization.
     */
    public async findDuplicates<K extends keyof T>(
        field: K,
        options?: {
            mode?: 'equals' | 'contains';
            caseInsensitive?: boolean;
            normalize?: boolean; // trim + collapse whitespace
            minLength?: number; // minimum length to consider when using contains
            comparator?: (a: string, b: string) => boolean; // custom match rule
            keyNormalizer?: (s: string) => string; // custom normalization used for grouping keys
        }
    ): Promise<{ key: string; items: T[] }[]> {
        const { mode = 'equals', caseInsensitive = true, normalize = true, minLength = 2, comparator, keyNormalizer } = options || {};

        const items = await this.table.toArray();

        const normalizeValue = (v: unknown): string => {
            let s = typeof v === 'string' ? v : String(v ?? '');
            if (normalize) {
                s = s.trim().replace(/\s+/g, ' ');
            }
            if (caseInsensitive) {
                s = s.toLocaleLowerCase();
            }
            return s;
        };

        const toKey = (s: string): string => (keyNormalizer ? keyNormalizer(s) : s);

        if (mode === 'equals') {
            const map = new Map<string, T[]>();
            for (const item of items) {
                const raw = normalizeValue(item[field]);
                const key = toKey(raw);
                const group = map.get(key) || [];
                group.push(item);
                map.set(key, group);
            }
            const result = Array.from(map.entries())
                .filter(([, group]) => group.length > 1)
                .map(([key, group]) => ({ key, items: group }));
            // If a custom comparator is provided, further split groups to only those that actually match
            if (comparator) {
                return result
                    .map(g => {
                        const filtered: T[] = [];
                        for (let i = 0; i < g.items.length; i++) {
                            const ai = normalizeValue((g.items[i] as any)[field]);
                            for (let j = i + 1; j < g.items.length; j++) {
                                const bj = normalizeValue((g.items[j] as any)[field]);
                                if (comparator(ai, bj)) {
                                    // push both ensuring uniqueness
                                    if (!filtered.includes(g.items[i])) filtered.push(g.items[i]);
                                    if (!filtered.includes(g.items[j])) filtered.push(g.items[j]);
                                }
                            }
                        }
                        return filtered.length > 1 ? { key: g.key, items: filtered } : undefined;
                    })
                    .filter(Boolean) as { key: string; items: T[] }[];
            }
            return result;
        } else {
            // contains mode: build index then group items according to comparator or substring rules
            const values = items.map(i => ({ item: i, val: normalizeValue(i[field]) })).filter(v => v.val.length >= minLength);
            const duplicates: { key: string; items: T[] }[] = [];
            const visited = new Set<number>();

            for (let i = 0; i < values.length; i++) {
                if (visited.has(i)) continue;
                const base = values[i];
                const group: T[] = [base.item];
                for (let j = i + 1; j < values.length; j++) {
                    if (visited.has(j)) continue;
                    const candidate = values[j];
                    const match = comparator ? comparator(base.val, candidate.val) : (base.val.includes(candidate.val) || candidate.val.includes(base.val));
                    if (match) {
                        group.push(candidate.item);
                        visited.add(j);
                    }
                }
                if (group.length > 1) {
                    duplicates.push({ key: toKey(base.val), items: group });
                }
            }
            return duplicates;
        }
    }
}