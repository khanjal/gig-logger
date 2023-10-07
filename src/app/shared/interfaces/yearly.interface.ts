import { IPeriodicBase } from "./periodic-base.interface";

export interface IYearly extends IPeriodicBase {
    year: number
    days: number
}