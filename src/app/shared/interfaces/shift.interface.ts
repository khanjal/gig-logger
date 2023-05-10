import { IAmount } from "./amount.interface";

export interface IShift extends IAmount {
    id?: number;
    date: string;
    distance: number;
    end: string;
    key: string;
    saved: string;
    service: string;
    number: number;
    start: string;
    trips: number;
}