import { ActionEnum } from "@enums/action.enum";
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
    action: string;
    actionTime: number;
}

export function clearShiftAction(shift: IShift) {
    shift.action = '';
    shift.actionTime = 0;
    shift.saved = true;
}

export function updateShiftAction(shift: IShift, action: string) {
    if (shift.action != ActionEnum.Add) {
        shift.action = action;
    }
    shift.actionTime = Date.now();
    shift.saved = false;
}