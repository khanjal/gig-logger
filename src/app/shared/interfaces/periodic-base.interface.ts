import type { IAmountPer } from "@interfaces/amount-per.interface"

export interface IPeriodicBase extends IAmountPer {
    trips: number
    distance: number
    time: string
}