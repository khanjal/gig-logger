import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ISheet } from "@interfaces/sheet.interface";
import { AddressService } from "./address.service";
import { DeliveryService } from "./delivery.service";
import { NameService } from "./name.service";
import { PlaceService } from "./place.service";
import { ServiceService } from "./service.service";
import { ShiftService } from "./shift.service";
import { SpreadsheetService } from "./spreadsheet.service";
import { TripService } from "./trip.service";
import { WeekdayService } from "./weekday.service";

@Injectable()
export class GigLoggerService {
    apiUrl = "https://atftzfc4p0.execute-api.us-east-1.amazonaws.com/staging/sheet/";


    constructor(
        private _http: HttpClient,
        private _addressService: AddressService,
        private _deliveryService: DeliveryService,
        private _nameService: NameService,
        private _placeService: PlaceService,
        private _serviceService: ServiceService,
        private _shiftService: ShiftService,
        private _spreadsheetService: SpreadsheetService,
        private _tripService: TripService,
        private _weekdayService: WeekdayService
    ) {}

    public async getSheetData(sheetId: string | undefined) {
        return this._http.get(`${this.apiUrl}${sheetId}/primary`);
    }

    public async loadData(sheetData: ISheet) {
        await this._addressService.loadAddresses(sheetData.addresses);
        await this._nameService.loadNames(sheetData.names);
        await this._placeService.loadPlaces(sheetData.places);
        await this._serviceService.loadServices(sheetData.services);
        await this._shiftService.loadShifts(sheetData.shifts);
        await this._tripService.loadTrips(sheetData.trips);
        await this._weekdayService.loadWeekdays(sheetData.weekdays);

        // TODO: Deliveries part
    }

    public async appendData(sheetData: ISheet) {
        await this._addressService.updateAddresses(sheetData.addresses);
    }
}