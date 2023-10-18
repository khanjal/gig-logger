import { IAmount } from "./amount.interface";

export interface IStatItem extends IAmount {
    name: string;
    time: string;
    trips: number;
    distance: number;
    amountPerTrip: number;
    amountPerDistance: number;
    amountPerTime: number;
}