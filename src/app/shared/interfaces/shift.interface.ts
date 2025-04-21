import { IAmountPer } from "./amount-per.interface";

export interface IShift extends IAmountPer {
    id?: number;
    rowId: number;
    date: string;
    distance: number;
    active: string;
    finish: string;
    key: string;
    region: string;
    saved: boolean;
    service: string;
    number: number;
    start: string;
    time: string;
    trips: number;
    totalTrips: number;
    totalDistance: number;
    totalPay: number;
    totalTips: number;
    totalBonus: number;
    grandTotal: number;
    totalCash: number;
    note: string;
    action: string;
    actionTime: number;
}