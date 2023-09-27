import { IPeriodicBase } from "./periodic-base.interface";

export interface IWeekday extends IPeriodicBase {
    id: number;
    day: string;
    days: number;
    dailyAverage: number;
    dailyPrevAverage: number;
    currentAmount: number;
    previousAmount: number;
}