import { Injectable } from "@angular/core";
import { ISheet } from "@interfaces/sheet.interface";
import { ISheetProperties } from "@interfaces/sheet-properties.interface";
import { IShift } from "@interfaces/shift.interface";
import { ApiService } from "./api.service";
import { DataLoaderService } from "./data/data-loader.service";
import { DataLinkingService } from "./data/data-linking.service";
import { ShiftCalculatorService } from "./calculations/shift-calculator.service";

@Injectable({
    providedIn: 'root'
})
export class GigWorkflowService {

    constructor(
        private _apiService: ApiService,
        private _dataLoader: DataLoaderService,
        private _dataLinking: DataLinkingService,
        private _calculator: ShiftCalculatorService
    ) {}

    // Auth Methods - Delegate to API Service
    public async setRefreshToken(authToken: string) {
        return this._apiService.setRefreshToken(authToken);
    }

    public async clearRefreshToken() {
        return this._apiService.clearRefreshToken();
    }

    public async refreshAuthToken() {
        return this._apiService.refreshAuthToken();
    }

    // File Methods - Delegate to API Service
    public async createFile(properties: ISheetProperties): Promise<ISheetProperties | null> {
        return this._apiService.createFile(properties);
    }

    public async listFiles(): Promise<ISheetProperties[]> {
        return this._apiService.listFiles();
    }

    // Sheet Methods - Delegate to API Service
    public async getSheetData(sheetId: string): Promise<ISheet | null> {
        return this._apiService.getSheetData(sheetId);
    }

    public async getSheetSingle(sheetId: string, sheetName: string) {
        return this._apiService.getSheetSingle(sheetId, sheetName);
    }

    public async getSecondarySheetData(sheetId: string) {
        return this._apiService.getSecondarySheetData(sheetId);
    }

    public async postSheetData(sheetData: ISheet): Promise<any> {
        return this._apiService.postSheetData(sheetData);
    }

    public async createSheet(properties: ISheetProperties) {
        return this._apiService.createSheet(properties);
    }

    public async warmupLambda(sheetId: string): Promise<any> {
        return this._apiService.warmupLambda(sheetId);
    }

    public async healthCheck(sheetId: string) {
        return this._apiService.healthCheck(sheetId);
    }

    // Data Methods - Delegate to Data Loader
    public async loadData(sheetData: ISheet) {
        return this._dataLoader.loadData(sheetData);
    }

    public async appendData(sheetData: ISheet) {
        return this._dataLoader.appendData(sheetData);
    }

    // Calculation Methods - Delegate to Calculator
    public async calculateShiftTotals(shifts: IShift[] = []) {
        return this._calculator.calculateShiftTotals(shifts);
    }

    public async calculateDailyTotal(dates: string[] = []) {
        return this._calculator.calculateDailyTotal(dates);
    }

    // Data Linking Methods - Delegate to Data Linking
    public async updateAncillaryInfo() {
        return this._dataLinking.updateAncillaryInfo();
    }
}