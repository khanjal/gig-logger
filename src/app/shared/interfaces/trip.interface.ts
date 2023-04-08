export interface ITrip {
    id: number;
    startAddress: string;
    endAddress: string;
    bonus?: number;
    cash?: number;
    date: string;
    distance: number;
    key: string;
    name: string;
    note: string;
    pay: number;
    place: string;
    saved: boolean;
    service: string;
    shiftNumber: number;
    time: string;
    tip?: number;
    total: number;
}