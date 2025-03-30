import { ICrudService } from "@interfaces/crud-service.interface";

export interface ICrudAdvanced<T> extends ICrudService<T> {
    append(items: T[]): Promise<void>;
}