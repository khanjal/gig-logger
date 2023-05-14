import { IAmount } from "./amount.interface";

export interface ITrip extends IAmount {
    id: number;
    date: string;
    distance: number;
    endAddress: string;
    dropoffTime: string;
    key: string;
    name: string;
    note: string;
    number: number;
    pickupTime: string;
    place: string;
    saved: string;
    service: string;
    startAddress: string;
}