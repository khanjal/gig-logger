import type { IAddress } from "@interfaces/entities/address.interface";
import type { IDaily } from "@interfaces/sheets/daily.interface";
import type { IDelivery } from "@interfaces/entities/delivery.interface";
import type { IExpense } from "@interfaces/entities/expense.interface";
import type { ILocation } from "@interfaces/entities/location.interface";
import type { IMonthly } from "@interfaces/sheets/monthly.interface";
import type { IName } from "@interfaces/entities/name.interface";
import type { IPlace } from "@interfaces/entities/place.interface";
import type { IRegion } from "@interfaces/entities/region.interface";
import type { IService } from "@interfaces/entities/service.interface";
import type { ISetup } from "@interfaces/sheets/setup.interface";
import type { IShift } from "@interfaces/entities/shift.interface";
import type { ITrip } from "@interfaces/entities/trip.interface";
import type { IType } from "@interfaces/entities/type.interface";
import type { IWeekday } from "@interfaces/sheets/weekday.interface";
import type { IWeekly } from "@interfaces/sheets/weekly.interface";
import type { IYearly } from "@interfaces/sheets/yearly.interface";

/**
 * Mirrors RaptorSheets.Gig's GigSheets container - every domain sheet's row collection,
 * nested under ISheet.sheets so a sheet name can never collide with the reserved
 * properties/messages members.
 */
export interface IGigSheets {
    addresses: IAddress[];
    daily: IDaily[];
    deliveries: IDelivery[];
    expenses: IExpense[];
    locations: ILocation[];
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
}
