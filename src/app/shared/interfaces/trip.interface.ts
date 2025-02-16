import { ActionEnum } from "@enums/action.enum";
import { IAmount } from "./amount.interface";

export interface ITrip extends IAmount {
    id?: number;
    rowId: number;
    date: string;
    distance: number;
    endAddress: string;
    endUnit: string;
    endOdometer: number;
    exclude: boolean;
    dropoffTime: string;
    duration: string;
    key: string;
    name: string;
    note: string;
    number: number;
    orderNumber: string;
    pickupTime: string;
    place: string;
    region: string;
    saved: boolean;
    service: string;
    startAddress: string;
    startOdometer: number;
    type: string;
    amountPerDistance: number;
    amountPerTime: number;
    action: string;
    actionTime: number;
}

export function clearTripAction(trip: ITrip) {
    trip.action = '';
    trip.actionTime = 0;
    trip.saved = true;
}

export function updateTripAction(trip: ITrip, action: string) {
    if (trip.action != ActionEnum.Add) {
        trip.action = action;
    }
    trip.actionTime = Date.now();
    trip.saved = false;
}