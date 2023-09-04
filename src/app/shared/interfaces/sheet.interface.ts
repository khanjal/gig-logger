import { IAddress } from "./address.interface";
import { IName } from "./name.interface";
import { IPlace } from "./place.interface";
import { IRegion } from "./region.interface";
import { IService } from "./service.interface";
import { IShift } from "./shift.interface";
import { ITrip } from "./trip.interface";
import { IType } from "./type.interface";
import { IWeekday } from "./weekday.interface";

export interface ISheet {
    name: string;
    addresses: IAddress[];
    names: IName[];
    places: IPlace[];
    regions: IRegion[];
    services: IService[];
    shifts: IShift[];
    trips: ITrip[];
    types: IType[];
    weekdays: IWeekday[]
}