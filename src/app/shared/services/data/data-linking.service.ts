import { Injectable, inject } from "@angular/core";
import { AddressService } from "@services/sheets/address.service";
import { NameService } from "@services/sheets/name.service";
import { PlaceService } from "@services/sheets/place.service";
import { RegionService } from "@services/sheets/region.service";
import { ServiceService } from "@services/sheets/service.service";
import { TripService } from "@services/sheets/trip.service";
import { TypeService } from "@services/sheets/type.service";
import { LoggerService } from "@services/logger.service";
import type { GenericCrudService } from "@services/generic-crud.service";

@Injectable({
    providedIn: 'root'
})
export class DataLinkingService {
    private _addressService = inject(AddressService);
    private _nameService = inject(NameService);
    private _placeService = inject(PlaceService);
    private _regionService = inject(RegionService);
    private _serviceService = inject(ServiceService);
    private _tripService = inject(TripService);
    private _typeService = inject(TypeService);
    private _logger = inject(LoggerService);


    private handleError(operation: string, error: unknown): void {
        const err = error as { message?: string } | null | undefined;
        this._logger.error(`${operation} failed`, {
            message: err?.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            operation
        });
    }

    public async updateAncillaryInfo() {
        try {
            this._logger.info('Updating ancillary info');

            // Delete all unsaved services, regions, places, types, names, and addresses
            await Promise.all([
                this._addressService.deleteUnsaved(),
                this._nameService.deleteUnsaved(),
                this._placeService.deleteUnsaved(),
                this._regionService.deleteUnsaved(),
                this._serviceService.deleteUnsaved(),
                this._typeService.deleteUnsaved()
            ]);

            const trips = await this._tripService.getPreviousDays(2);

            for (const trip of trips) {
                await Promise.all([
                    this.addIfNotExists('endAddress', trip.endAddress, this._addressService),
                    this.addIfNotExists('name', trip.name, this._nameService),
                    this.addIfNotExists('place', trip.place, this._placeService),
                    this.addIfNotExists('region', trip.region, this._regionService),
                    this.addIfNotExists('service', trip.service, this._serviceService),
                    this.addIfNotExists('startAddress', trip.startAddress, this._addressService),
                    this.addIfNotExists('type', trip.type, this._typeService)
                ]);
            }
              this._logger.info('Ancillary info updated successfully');
        } catch (error) {
            this.handleError('updateAncillaryInfo', error);
            throw error;
        }
    }

    private async addIfNotExists<T extends object>(field: string, value: string | undefined, service: GenericCrudService<T>) {
        if (!value) return;

        const fieldMap: Record<string, string> = {
            'endAddress': 'address',
            'startAddress': 'address',
            'name': 'name',
            'place': 'place',
            'region': 'region',
            'service': 'service',
            'type': 'type'
        };

        const searchField = fieldMap[field];
        const existing = await service.find(searchField, value);

        if (!existing) {
            const newItem = { [searchField]: value } as T;
            await service.add(newItem);
        }
    }
}
