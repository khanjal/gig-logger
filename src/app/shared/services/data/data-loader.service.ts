import { Injectable, inject } from "@angular/core";
import type { ISheet } from "@interfaces/sheets/sheet.interface";
import { AddressService } from "../sheets/address.service";
import { DailyService } from "../sheets/daily.service";
import { MonthlyService } from "../sheets/monthly.service";
import { NameService } from "../sheets/name.service";
import { PlaceService } from "../sheets/place.service";
import { RegionService } from "../sheets/region.service";
import { ServiceService } from "../sheets/service.service";
import { ShiftService } from "../sheets/shift.service";
import { TripService } from "../sheets/trip.service";
import { TypeService } from "../sheets/type.service";
import { WeekdayService } from "../sheets/weekday.service";
import { WeeklyService } from "../sheets/weekly.service";
import { YearlyService } from "../sheets/yearly.service";
import { DeliveryService } from "../sheets/delivery.service";
import { LocationService } from "../sheets/location.service";
import { LoggerService } from "../logger.service";
import { ExpensesService } from "@services/sheets/expenses.service";

@Injectable({
    providedIn: 'root'
})
export class DataLoaderService {
    private _addressService = inject(AddressService);
    private _dailyService = inject(DailyService);
    private _deliveryService = inject(DeliveryService);
    private _expenseService = inject(ExpensesService);
    private _locationService = inject(LocationService);
    private _monthlyService = inject(MonthlyService);
    private _nameService = inject(NameService);
    private _placeService = inject(PlaceService);
    private _regionService = inject(RegionService);
    private _serviceService = inject(ServiceService);
    private _shiftService = inject(ShiftService);
    private _tripService = inject(TripService);
    private _typeService = inject(TypeService);
    private _weekdayService = inject(WeekdayService);
    private _weeklyService = inject(WeeklyService);
    private _yearlyService = inject(YearlyService);
    private _logger = inject(LoggerService);


    private handleError(operation: string, error: unknown): void {
        const err = error as { message?: string } | null | undefined;
        this._logger.error(`${operation} failed`, {
            message: err?.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            operation
        });
    }

    public async loadData(sheetData: ISheet) {
        try {
            this._logger.info('Starting data load process');

            // Load all sheet data in parallel for better performance.
            // Deliveries/Locations are server-computed aggregates (RaptorSheets.Gig Deliveries/
            // Locations sheets) - loaded directly, no client-side linking needed.
            await Promise.all([
                this._addressService.load(sheetData.addresses),
                this._dailyService.load(sheetData.daily),
                this._deliveryService.load(sheetData.deliveries),
                this._expenseService.load(sheetData.expenses),
                this._locationService.load(sheetData.locations),
                this._monthlyService.load(sheetData.monthly),
                this._nameService.load(sheetData.names),
                this._placeService.load(sheetData.places),
                this._regionService.load(sheetData.regions),
                this._serviceService.load(sheetData.services),
                this._typeService.load(sheetData.types),
                this._weekdayService.load(sheetData.weekdays),
                this._weeklyService.load(sheetData.weekly),
                this._yearlyService.load(sheetData.yearly)
            ]);

            // Load shifts and trips sequentially (they may depend on other data)
            await this._shiftService.load(sheetData.shifts);
            await this._tripService.load(sheetData.trips);

            this._logger.info('Data loading completed successfully');
        } catch (error) {
            this.handleError('loadData', error);
            throw error;
        }
    }

    public async appendData(sheetData: ISheet) {
        try {
            this._logger.info('Appending data');

            await this._addressService.append(sheetData.addresses);
            await this._nameService.append(sheetData.names);
            // Deliveries/Locations are always a complete, freshly-computed snapshot from the
            // server, so re-load rather than append.
            await this._deliveryService.load(sheetData.deliveries);
            await this._locationService.load(sheetData.locations);

            this._logger.info('Data appending completed');
        } catch (error) {
            this.handleError('appendData', error);
            throw error;
        }
    }
}
