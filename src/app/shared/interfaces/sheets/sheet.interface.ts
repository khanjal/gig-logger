import { IAddress } from "@interfaces/entities/address.interface";
import { IDaily } from "@interfaces/sheets/daily.interface";
import { IExpense } from "@interfaces/entities/expense.interface";
import { IMessage } from "@interfaces/sheets/message.interface";
import { IMonthly } from "@interfaces/sheets/monthly.interface";
import { IName } from "@interfaces/entities/name.interface";
import { IPlace } from "@interfaces/entities/place.interface";
import { IRegion } from "@interfaces/entities/region.interface";
import { IService } from "@interfaces/entities/service.interface";
import { ISetup } from "@interfaces/sheets/setup.interface";
import { ISheetProperties } from "@interfaces/sheets/sheet-properties.interface";
import { IShift } from "@interfaces/entities/shift.interface";
import { ITrip } from "@interfaces/entities/trip.interface";
import { IType } from "@interfaces/entities/type.interface";
import { IWeekday } from "@interfaces/sheets/weekday.interface";
import { IWeekly } from "@interfaces/sheets/weekly.interface";
import { IYearly } from "@interfaces/sheets/yearly.interface";

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