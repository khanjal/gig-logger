import { IAddress } from "@interfaces/address.interface";
import { IDaily } from "@interfaces/daily.interface";
import { IExpense } from "@interfaces/expense.interface";
import { IMessage } from "@interfaces/message.interface";
import { IMonthly } from "@interfaces/monthly.interface";
import { IName } from "@interfaces/name.interface";
import { IPlace } from "@interfaces/place.interface";
import { IRegion } from "@interfaces/region.interface";
import { IService } from "@interfaces/service.interface";
import { ISetup } from "@interfaces/setup.interface";
import { ISheetProperties } from "@interfaces/sheet-properties.interface";
import { IShift } from "@interfaces/shift.interface";
import { ITrip } from "@interfaces/trip.interface";
import { IType } from "@interfaces/type.interface";
import { IWeekday } from "@interfaces/weekday.interface";
import { IWeekly } from "@interfaces/weekly.interface";
import { IYearly } from "@interfaces/yearly.interface";

export interface ISheet {
    properties: ISheetProperties;
    addresses: IAddress[];
    daily: IDaily[];
    expenses: IExpense[];
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