import { IPeriodicBase } from "./periodic-base.interface";

export interface IWeekday extends IPeriodicBase {
    id: number;
    rowId: number;
    day: number;
    days: number;
    dailyAverage: number;
    dailyPrevAverage: number;
    currentAmount: number;
    previousAmount: number;
}