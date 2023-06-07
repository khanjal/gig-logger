import { IAddress } from "./address.interface";
import { IName } from "./name.interface";
import { IPlace } from "./place.interface";
import { IService } from "./service.interface";
import { IShift } from "./shift.interface";
import { ITrip } from "./trip.interface";
import { IWeekday } from "./weekday.interface";

export interface ISheet {
    addresses: IAddress[];
    names: IName[];
    places: IPlace[];
    services: IService[];
    shifts: IShift[];
    trips: ITrip[];
    weekdays: IWeekday[]
}