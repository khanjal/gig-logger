import { IAddress } from "./address.interface";
import { IDaily } from "./daily.interface";
import { IMessage } from "./message.interface";
import { IMonthly } from "./monthly.interface";
import { IName } from "./name.interface";
import { IPlace } from "./place.interface";
import { IRegion } from "./region.interface";
import { IService } from "./service.interface";
import { ISetup } from "./setup.interface";
import { ISheetProperties } from "./sheet-properties.interface";
import { IShift } from "./shift.interface";
import { ITrip } from "./trip.interface";
import { IType } from "./type.interface";
import { IWeekday } from "./weekday.interface";
import { IWeekly } from "./weekly.interface";
import { IYearly } from "./yearly.interface";

export interface ISheet {
    properties: ISheetProperties;
    addresses: IAddress[];
    daily: IDaily[];
    monthly: IMonthly[];
    names: IName[];
    places: IPlace[];
    regions: IRegion[];
    services: IService[];
    setup: ISetup[];
    shifts: IShift[];
    trips: ITrip[];
    types: IType[];
    weekdays: IWeekday[];
    weekly: IWeekly[];
    yearly: IYearly[];
    messages: IMessage[];
}