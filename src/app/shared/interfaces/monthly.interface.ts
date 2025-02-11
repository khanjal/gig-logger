import { IPeriodicBase } from "./periodic-base.interface";

export interface IMonthly extends IPeriodicBase {
    rowId: number;
    month: string
    days: number
    number: number
    year: number
}