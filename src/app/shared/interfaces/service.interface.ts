import { IAmount } from "./amount.interface";

export interface IService extends IAmount {
    id: number;
    service: string;
    visits: number;
}