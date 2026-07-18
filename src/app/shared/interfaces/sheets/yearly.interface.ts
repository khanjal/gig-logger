import { IPeriodicBase } from "@interfaces/sheets/periodic-base.interface";

export interface IYearly extends IPeriodicBase {
    rowId: number;
    year: number
    days: number
}