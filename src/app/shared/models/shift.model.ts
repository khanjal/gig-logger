export class ShiftModel {
    id: number = 0;
    date: string = new Date().toDateString();;
    distance: number = 0;
    end: string = "";
    key: string = "";
    saved: boolean = false;
    service: string = "";
    shiftNumber: number = 0;
    start: string = "";
}