import { IAmount } from "./amount.interface"
import { INote } from "./note.interface"
import { ITrip } from "./trip.interface"

export interface IDelivery extends IAmount {
    name: string
    address: string
    dates: string[]
    notes: INote[]
    places: string[]
    services: string[]
    trips: ITrip[]
    units: string[]
    visits: number
}