import type { IAmount } from "@interfaces/amount.interface";

export interface IAmountPer extends IAmount {
    amountPerTrip: number;
    amountPerDistance: number;
    amountPerTime: number;
}