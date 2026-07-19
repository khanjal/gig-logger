import type { IAddress } from "@interfaces/entities/address.interface";
import type { IDaily } from "@interfaces/sheets/daily.interface";
import type { IExpense } from "@interfaces/entities/expense.interface";
import type { IMessage } from "@interfaces/sheets/message.interface";
import type { IMonthly } from "@interfaces/sheets/monthly.interface";
import type { IName } from "@interfaces/entities/name.interface";
import type { IPlace } from "@interfaces/entities/place.interface";
import type { IRegion } from "@interfaces/entities/region.interface";
import type { IService } from "@interfaces/entities/service.interface";
import type { ISetup } from "@interfaces/sheets/setup.interface";
import type { ISheetProperties } from "@interfaces/sheets/sheet-properties.interface";
import type { IShift } from "@interfaces/entities/shift.interface";
import type { ITrip } from "@interfaces/entities/trip.interface";
import type { IType } from "@interfaces/entities/type.interface";
import type { IWeekday } from "@interfaces/sheets/weekday.interface";
import type { IWeekly } from "@interfaces/sheets/weekly.interface";
import type { IYearly } from "@interfaces/sheets/yearly.interface";

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