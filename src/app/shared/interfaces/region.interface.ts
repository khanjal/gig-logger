import { IAmount } from "./amount.interface";

export interface IRegion extends IAmount {
    id?: number;
    region: string;
    visits: number;
}