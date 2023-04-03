export class ShiftModel {
    id: number = 0;
    date: string = new Date().toLocaleDateString();;
    distance: number = 0;
    end: string = "";
    key: string = "";
    saved: boolean = false;
    service: string = "";
    shiftNumber: number = 0;
    start: string = "";
    total: number = 0;
    trips: number = 0;
}