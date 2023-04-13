export class TripModel {
    id?: number;
    startAddress: string = "";
    endAddress: string = "";
    bonus: number = 0;
    cash: number = 0;
    date: string = new Date().toLocaleDateString();
    distance: number = 0;
    key: string = "";
    name: string = "";
    note: string = "";
    pay: number = 0;
    place: string = "";
    saved: string = "false";
    service: string = "";
    number: number = 0;
    time: string = "";
    tip: number = 0;
    total: number = 0;
}