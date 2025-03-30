export interface ICrudService<T> {
    add(item: T): Promise<void>;
    delete(id: number): Promise<void>;
    filter(query: string): Promise<T[]>;
    find(item: string): Promise<T | undefined>;
    get(id: number): Promise<T | undefined>;
    list(): Promise<T[]>;
    load(items: T[]): Promise<void>;
    query(field: string, value: string | number): Promise<T[]>;
    append(items: T[]): Promise<void>;
  }