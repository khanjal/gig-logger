import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { firstValueFrom } from "rxjs";
import { ISheet } from "@interfaces/sheet.interface";
import { ISheetProperties } from "@interfaces/sheet-properties.interface";
import { SecureCookieStorageService } from './secure-cookie-storage.service';
import { authConfig } from './auth.config';
import { AUTH_CONSTANTS } from "@constants/auth.constants";
import { LoggerService } from './logger.service';
import { getCurrentUserId } from '../utils/user-id.util';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = environment.gigLoggerApi;

    // API Endpoints Constants
    private readonly API_ENDPOINTS = {
        // Auth endpoints
        AUTH: '/auth',
        AUTH_REFRESH: '/auth/refresh',
        AUTH_CLEAR: '/auth/clear',
        
        // File endpoints
        FILES_CREATE: '/files/create',
        FILES_LIST: '/files/list',
        
        // Sheet endpoints
        SHEETS_ALL: '/sheets/all',
        SHEETS_SINGLE: '/sheets/single',
        SHEETS_MULTIPLE: '/sheets/multiple',
        SHEETS_SAVE: '/sheets/save',
        SHEETS_CREATE: '/sheets/create',
        SHEETS_CHECK: '/sheets/check',
        SHEETS_HEALTH: '/sheets/health'
    } as const;

    constructor(
        private _http: HttpClient,
        private _secureCookieStorage: SecureCookieStorageService,
        private logger: LoggerService
    ) {}    // Centralized error handler
    private handleError(operation: string, error: any): void {
        this.logger.error(`${operation} failed`, {
            message: error.message || 'Unknown error',
            status: error.status || 'No status',
            statusText: error.statusText || 'No status text',
            url: error.url || 'No URL',
            timestamp: new Date().toISOString(),
            operation
        });
    }

    private setHeader(sheetId?: string) {
        let headers = new HttpHeaders();
        
        if (sheetId) {
            headers = headers.set('Sheet-Id', sheetId);
        }
        
        headers = headers.set('Content-Type', "application/json");
        
        const accessToken = this._secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
        if (accessToken) {
            headers = headers.set('Authorization', `Bearer ${accessToken}`);
        }

        // Add UserId header for rate limiting and user identification (like Places API)
        const userId = getCurrentUserId();
        if (userId) {
            headers = headers.set('UserId', userId);
        }
        
        return headers;
    }

    private setOptions(sheetId?: string) {
        const options = {
            withCredentials: true,
            headers: this.setHeader(sheetId),
        };

        return options;
    }

    /**
     * Handles response that may contain direct sheet data or S3 link
     * @param response API response containing either sheetEntity or s3Link
     * @param operation Operation name for logging
     * @returns Sheet data or null
     */
    private async handleSheetResponse(response: any, operation: string): Promise<any> {
        if (response.isStoredInS3 && response.s3Link) {
            this.logger.debug(`Large ${operation} data stored in S3, fetching from: ${response.s3Link}`);
            const s3Response = await firstValueFrom(
                this._http.get<any>(response.s3Link)
            );
            return s3Response;
        } else if (response.sheetEntity) {
            this.logger.debug(`${operation} data loaded directly`);
            return response.sheetEntity;
        } else {
            this.logger.warn(`Invalid response format for ${operation}: no sheetEntity or s3Link provided`);
            return null;
        }
    }    
    
    // ========================================
    // AUTH METHODS
    // ========================================
    
    public async setRefreshToken(authToken: string) {
        try {
            if (typeof authToken !== 'string') {
                throw new Error('Invalid auth token format. Expected a string.');
            }

            const tokenData = {
                code: authToken,
                codeVerifier: this._secureCookieStorage.getItem(AUTH_CONSTANTS.PKCE_VERIFIER),
                redirectUri: authConfig.redirectUri
            };

            if (!tokenData.codeVerifier) {
                throw new Error('No PKCE verifier found in storage');
            }

            const response = await firstValueFrom(this._http.post<any>(
                `${this.apiUrl}${this.API_ENDPOINTS.AUTH}`, 
                JSON.stringify(tokenData), 
                this.setOptions()
            ));

            this.logger.debug('Refresh token set successfully');
            return response;
        } catch (error) {
            this.handleError('setRefreshToken', error);
            return null;
        }
    }

    public async clearRefreshToken() { 
        try {
            const response = await firstValueFrom(
                this._http.post<any>(`${this.apiUrl}${this.API_ENDPOINTS.AUTH_CLEAR}`, null)
            );
            this.logger.debug('Refresh token cleared successfully');
            return response;
        } catch (error) {
            this.handleError('clearRefreshToken', error);
            return null;
        }
    }

    public async refreshAuthToken() { 
        try {
            const response = await firstValueFrom(this._http.post<any>(
                `${this.apiUrl}${this.API_ENDPOINTS.AUTH_REFRESH}`, 
                null,
                this.setOptions()
            ));
            this.logger.debug('Auth token refreshed successfully');
            return response;
        } catch (error) {
            this.handleError('refreshAuthToken', error);
            return null;
        }
    }    
    
    // ========================================
    // FILE METHODS
    // ========================================
    
    public async createFile(properties: ISheetProperties): Promise<ISheetProperties | null> {
        try {
            const response = await firstValueFrom(
                this._http.post<any>(
                    `${this.apiUrl}${this.API_ENDPOINTS.FILES_CREATE}`, 
                    JSON.stringify(properties), 
                    this.setOptions()
                )
            );
            this.logger.info(`File created: ${properties.name}`);
            return response;
        } catch (error) {
            this.handleError('createFile', error);
            return null;
        }
    }

    public async listFiles(): Promise<ISheetProperties[]> {
        try {
            const response = await firstValueFrom(
                this._http.get<ISheetProperties[]>(
                    `${this.apiUrl}${this.API_ENDPOINTS.FILES_LIST}`, 
                    this.setOptions()
                )
            );
            this.logger.debug(`Files listed: ${response.length} files found`);
            return response;
        } catch (error) {
            this.handleError('listFiles', error);
            return [];
        }
    }    

    // ========================================
    // SHEET METHODS
    // ========================================
    
    public async getSheetData(sheetId: string): Promise<ISheet | null> {
        try {
            const response = await firstValueFrom(
                this._http.get<any>(
                    `${this.apiUrl}${this.API_ENDPOINTS.SHEETS_ALL}`, 
                    this.setOptions(sheetId)
                )
            );
            
            return await this.handleSheetResponse(response, 'sheet');
        } catch (error) {
            this.handleError('getSheetData', error);
            return null;
        }
    }
      public async getSheetSingle(sheetId: string, sheetName: string) {
        try {
            const response = await firstValueFrom(
                this._http.get<any>(
                    `${this.apiUrl}${this.API_ENDPOINTS.SHEETS_SINGLE}/${sheetName}`, 
                    this.setOptions(sheetId)
                )
            );
            
            return await this.handleSheetResponse(response, `single sheet '${sheetName}'`);
        } catch (error) {
            this.handleError('getSheetSingle', error);
            throw error;
        }
    }

    public async getSecondarySheetData(sheetId: string) {
        try {
            const response = await firstValueFrom(
                this._http.get<any>(
                    `${this.apiUrl}${this.API_ENDPOINTS.SHEETS_MULTIPLE}?sheetName=names&sheetName=places&sheetName=trips`, 
                    this.setOptions(sheetId)
                )
            );
            
            return await this.handleSheetResponse(response, 'secondary sheet');
        } catch (error) {
            this.handleError('getSecondarySheetData', error);
            throw error;
        }
    }

    public async postSheetData(sheetData: ISheet): Promise<any> {
        try {
            const response = await firstValueFrom(
                this._http.post<any>(
                    `${this.apiUrl}${this.API_ENDPOINTS.SHEETS_SAVE}`, 
                    JSON.stringify(sheetData), 
                    this.setOptions(sheetData.properties.id)
                )
            );
            this.logger.info(`Sheet data saved: ${sheetData.properties.name}`);
            return response;
        } catch (error) {
            this.handleError('postSheetData', error);
            return null;
        }
    }

    public async createSheet(properties: ISheetProperties) {
        try {
            const response = this._http.post<any>(
                `${this.apiUrl}${this.API_ENDPOINTS.SHEETS_CREATE}`, 
                JSON.stringify(properties), 
                this.setOptions(properties.id)
            );
            this.logger.info(`Sheet creation requested: ${properties.name}`);
            return response;
        } catch (error) {
            this.handleError('createSheet', error);
            throw error;
        }
    }

    public async warmupLambda(sheetId: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this._http.get(
                    `${this.apiUrl}${this.API_ENDPOINTS.SHEETS_CHECK}`, 
                    this.setOptions(sheetId)
                )
            );
            this.logger.debug('Lambda warmed up successfully');
            return response;
        } catch (error) {
            this.handleError('warmupLambda', error);
            return null;
        }
    }

    public async healthCheck(sheetId: string) {
        try {
            const response = await firstValueFrom(
                this._http.get(
                    `${this.apiUrl}${this.API_ENDPOINTS.SHEETS_HEALTH}`, 
                    this.setOptions(sheetId)
                )
            );
            this.logger.debug('Health check completed');
            return response;
        } catch (error) {
            this.handleError('healthCheck', error);
            return null;
        }
    }
}