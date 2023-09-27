import { IPeriodicBase } from "./periodic-base.interface";

export interface IDaily extends IPeriodicBase {
    date: string
    day: number
    weekday: string
    week: string
    month: string
}