import { IPeriodicBase } from "./periodic-base.interface";

export interface IWeekly extends IPeriodicBase {
    rowId: number;
    week: string
    days: number
    average: number
    number: number
    year: number
    begin: Date
    end: Date
}