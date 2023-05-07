import { IShift } from "@interfaces/shift.interface";

export class ShiftModel implements IShift {
    id?: number;
    bonus: number = 0;
    cash: number = 0;
    date: string = new Date().toLocaleDateString();;
    distance: number = 0;
    end: string = "";
    key: string = "";
    pay: number = 0;
    saved: string = "false";
    service: string = "";
    number: number = 0;
    start: string = "";
    tip: number = 0;
    total: number = 0;
    trips: number = 0;
}