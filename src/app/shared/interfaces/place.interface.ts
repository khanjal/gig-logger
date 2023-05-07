import { IAmount } from "./amount.interface";

export interface IPlace extends IAmount {
    id: number;
    place: string;
    addresses: string[];
    visits: number;
}