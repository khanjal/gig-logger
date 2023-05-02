import { IName } from "./name.interface";

export interface IAddress {
    id: number;
    address: string;
    names: IName[];
    notes: string[];
    visits: number;
}