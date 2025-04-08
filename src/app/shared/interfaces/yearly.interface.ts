import { IPeriodicBase } from "./periodic-base.interface";

export interface IYearly extends IPeriodicBase {
    rowId: number;
    year: number
    days: number
}