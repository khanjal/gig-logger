import type { IAmount } from "@interfaces/sheets/amount.interface";

export interface IAmountPer extends IAmount {
    amountPerTrip: number;
    amountPerDistance: number;
    amountPerTime: number;
}