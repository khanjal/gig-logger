import type { ITrip } from "@interfaces/entities/trip.interface";

export interface ITripGroup {
    date: string,
    amount: number,
    average: number,
    trips: ITrip[];
}