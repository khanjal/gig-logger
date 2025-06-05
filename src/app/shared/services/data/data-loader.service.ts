import { Injectable } from "@angular/core";
import { ISheet } from "@interfaces/sheet.interface";
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
import { DeliveryService } from "../delivery.service";
import { DataLinkingService } from "./data-linking.service";

@Injectable({
    providedIn: 'root'
})
export class DataLoaderService {

    constructor(
        private _addressService: AddressService,
        private _dailyService: DailyService,
        private _deliveryService: DeliveryService,
        private _monthlyService: MonthlyService,
        private _nameService: NameService,
        private _placeService: PlaceService,
        private _regionService: RegionService,
        private _serviceService: ServiceService,
        private _shiftService: ShiftService,
        private _tripService: TripService,
        private _typeService: TypeService,
        private _weekdayService: WeekdayService,
        private _weeklyService: WeeklyService,
        private _yearlyService: YearlyService,
        private _dataLinking: DataLinkingService
    ) {}

    private handleError(operation: string, error: any): void {
        console.error(`❌ ${operation} failed:`, {
            message: error.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            operation
        });
    }

    public async loadData(sheetData: ISheet) {
        try {
            console.log('📊 Starting data load process...');
            
            // Load all sheet data in parallel for better performance
            await Promise.all([
                this._addressService.load(sheetData.addresses),
                this._dailyService.load(sheetData.daily),
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

            console.log('🔗 Linking data...');
            await this._dataLinking.linkAllData();

            await this._deliveryService.clear();
            await this._dataLinking.linkDeliveries(sheetData.trips);
            
            console.log('✅ Data loading completed successfully');
        } catch (error) {
            this.handleError('loadData', error);
            throw error;
        }
    }

    public async appendData(sheetData: ISheet) {
        try {
            console.log('📊 Appending data...');
            
            await this._addressService.append(sheetData.addresses);
            await this._nameService.append(sheetData.names);
            await this._dataLinking.linkDeliveries(sheetData.trips);
            
            console.log('✅ Data appending completed');
        } catch (error) {
            this.handleError('appendData', error);
            throw error;
        }
    }
}