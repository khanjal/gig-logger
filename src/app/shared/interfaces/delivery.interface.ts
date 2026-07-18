import type { IAmount } from "@interfaces/amount.interface"
import type { INote } from "@interfaces/note.interface"
import type { ITrip } from "@interfaces/trip.interface"

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