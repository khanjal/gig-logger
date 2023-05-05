import { ITrip } from "./trip.interface";

export interface ITripGroup {
    date: string,
    amount: number,
    average: number,
    trips: ITrip[];
}