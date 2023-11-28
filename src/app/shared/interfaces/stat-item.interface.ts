import { IAmountPer } from "./amount-per.interface";

export interface IStatItem extends IAmountPer {
    name: string;
    time: string;
    trips: number;
    distance: number;
}