import { IAmount } from "./amount.interface";

export interface IStatItem extends IAmount {
    name: string;
    trips: number;
    distance: number;
}