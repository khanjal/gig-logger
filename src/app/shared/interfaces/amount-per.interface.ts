import { IAmount } from "./amount.interface";

export interface IAmountPer extends IAmount {
    amountPerTrip: number;
    amountPerDistance: number;
    amountPerTime: number;
}