import { IActionRecord } from "@interfaces/sheets/action-record.interface";
import { IAmountPer } from "@interfaces/sheets/amount-per.interface";

export interface IShift extends IAmountPer, IActionRecord {
    id?: number;
    date: string;
    distance: number;
    active: string;
    finish: string;
    key: string;
    region: string;
    service: string;
    number: number;
    start: string;
    time: string;
    trips: number;
    totalActive: string;
    totalTime: string;
    totalTrips: number;
    totalDistance: number;
    totalPay: number;
    totalTips: number;
    totalBonus: number;
    grandTotal: number;
    totalCash: number;
    note: string;
    omit: boolean;
}