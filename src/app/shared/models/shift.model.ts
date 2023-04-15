import { IShift } from "@interfaces/shift.interface";

export class ShiftModel implements IShift {
    id?: number;
    date: string = new Date().toLocaleDateString();;
    distance: number = 0;
    end: string = "";
    key: string = "";
    saved: string = "false";
    service: string = "";
    number: number = 0;
    start: string = "";
    total: number = 0;
    trips: number = 0;
}