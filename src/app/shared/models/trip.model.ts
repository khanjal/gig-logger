export class TripModel {
    id: number = 0;
    startAddress: string = "";
    endAddress: string = "";
    bonus?: number;
    cash?: number;
    date: string = new Date().toLocaleDateString();
    distance: number = 0;
    key: string = "";
    name: string = "";
    note: string = "";
    pay: number = 0;
    place: string = "";
    saved: boolean = false;
    service: string = "";
    number: number = 0;
    time: string = "";
    tip?: number;
    total: number = 0;
}