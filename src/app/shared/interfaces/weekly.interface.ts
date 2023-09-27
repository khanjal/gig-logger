import { IPeriodicBase } from "./periodic-base.interface";

export interface IWeekly extends IPeriodicBase {
    week: string
    days: number
    number: number
    year: number
    begin: string
    end: string
}