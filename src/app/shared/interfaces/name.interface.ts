import { IAddress } from "./address.interface";

export interface IName {
    id: number;
    name: string;
    addresses: IAddress[];
    notes: string[];
    visits: number;
}