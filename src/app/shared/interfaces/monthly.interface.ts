import { IPeriodicBase } from "./periodic-base.interface";

export interface IMonthly extends IPeriodicBase {
    rowId: number;
    average: number;
    month: string;
    days: number;
    number: number;
    year: number;
}