import { Injectable } from "@angular/core";
import { ServiceModel } from "src/app/models/service.model";
import { GoogleDriveService } from "./googleSheet.service";

const sheetName = "Services";

@Injectable()
export class ServiceService {

    constructor(private _googleSheetService: GoogleDriveService) { }
        
    public async getServices(): Promise<ServiceModel[]> {
        let services: ServiceModel[] = [];
        let serviceData = localStorage.getItem('services') ?? '""';
        services = JSON.parse(serviceData);

        if (!services) {
            await this.loadServices();
            serviceData = localStorage.getItem('services') ?? "''";
            services = JSON.parse(serviceData);
        }

        // console.log(services);

        return services;
    }

    public async loadServices() {
        let sheet = await this._googleSheetService.getSheetDataByName(sheetName);

        console.log(sheet.title);
        console.log(sheet.rowCount);

        let rows = await sheet.getRows();
        let services: ServiceModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let serviceModel: ServiceModel = new ServiceModel;
            serviceModel.id = row.rowIndex;
            serviceModel.service = row['Service'];
            serviceModel.visits = row['Trips'];
            // console.log(placeModel);

            if (serviceModel.service) {
                services.push(serviceModel);
            }
            
        });
        // console.log(services);
        console.log(services.length);
        // console.log(services);

        // Load services into storage
        localStorage.setItem('services', JSON.stringify(services));
    }
}