import { IActionRecord } from "./action-record.interface";
import { IAmount } from "./amount.interface";

export interface ITrip extends IAmount, IActionRecord {
    id?: number;
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
    service: string;
    startAddress: string;
    startOdometer: number;
    type: string;
    amountPerDistance: number;
    amountPerTime: number;
}