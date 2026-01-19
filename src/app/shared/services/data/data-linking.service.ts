import { Injectable } from "@angular/core";
import { ITrip } from "@interfaces/trip.interface";
import { IDelivery } from "@interfaces/delivery.interface";
import { INote } from "@interfaces/note.interface";
import { IAddress } from "@interfaces/address.interface";
import { IType } from "@interfaces/type.interface";
import { AddressService } from "@services/sheets/address.service";
import { NameService } from "@services/sheets/name.service";
import { PlaceService } from "@services/sheets/place.service";
import { RegionService } from "@services/sheets/region.service";
import { ServiceService } from "@services/sheets/service.service";
import { TripService } from "@services/sheets/trip.service";
import { TypeService } from "@services/sheets/type.service";
import { DeliveryService } from "@services/delivery.service";
import { LoggerService } from "@services/logger.service";
import { sort } from "@helpers/sort.helper";
import { groupBy, uniquePush } from "@helpers/array.helper";

@Injectable({
    providedIn: 'root'
})
export class DataLinkingService {
    constructor(
        private _addressService: AddressService,
        private _deliveryService: DeliveryService,
        private _nameService: NameService,
        private _placeService: PlaceService,
        private _regionService: RegionService,
        private _serviceService: ServiceService,
        private _tripService: TripService,
        private _typeService: TypeService,
        private _logger: LoggerService
    ) {}

    private handleError(operation: string, error: any): void {
        this._logger.error(`${operation} failed`, {
            message: error.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            operation
        });
    }

    public async linkAllData() {
        try {
            await Promise.all([
                this.linkNameData(),
                this.linkAddressData(),
                this.linkPlaceData()
            ]);
        } catch (error) {
            this.handleError('linkAllData', error);
            throw error;
        }
    }

    public async linkDeliveries(trips: ITrip[]) {
        try {
            let deliveries: IDelivery[] = await this._deliveryService.list();
            // Build quick lookup for existing deliveries to avoid O(n*m) finds
            const keyFor = (addr?: string, name?: string) => `${addr || ''}::${name || ''}`;
            const deliveryMap = new Map<string, IDelivery>(deliveries.map(d => [keyFor(d.address, d.name), d]));

            for (const trip of trips) {
                if (!trip.endAddress && !trip.name) continue;

                let note: INote | undefined;
                if (trip.note) {
                    note = { date: trip.date, text: trip.note } as INote;
                }

                const key = keyFor(trip.endAddress, trip.name);
                let delivery = deliveryMap.get(key);

                if (delivery) {
                    delivery.bonus = (delivery.bonus || 0) + (trip.bonus || 0);
                    delivery.cash = (delivery.cash || 0) + (trip.cash || 0);
                    delivery.pay = (delivery.pay || 0) + (trip.pay || 0);
                    delivery.tip = (delivery.tip || 0) + (trip.tip || 0);
                    delivery.trips = delivery.trips || [];
                    delivery.trips.push(trip);
                    delivery.total = (delivery.total || 0) + (trip.total || 0);
                    delivery.visits = (delivery.visits || 0) + 1;

                    sort(delivery.trips, '-key');

                    delivery.dates = delivery.dates || [];
                    if (trip.date) uniquePush(delivery.dates, trip.date);

                    delivery.places = delivery.places || [];
                    if (trip.place) uniquePush(delivery.places, trip.place);

                    delivery.services = delivery.services || [];
                    if (trip.service) uniquePush(delivery.services, trip.service);

                    delivery.units = delivery.units || [];
                    if (trip.endUnit) uniquePush(delivery.units, trip.endUnit);

                    delivery.notes = delivery.notes || [];
                    if (note) delivery.notes.push(note);
                } else {
                    delivery = {
                        address: trip.endAddress,
                        bonus: trip.bonus || 0,
                        cash: trip.cash || 0,
                        dates: trip.date ? [trip.date] : [],
                        name: trip.name,
                        notes: note ? [note] : [],
                        pay: trip.pay || 0,
                        places: trip.place ? [trip.place] : [],
                        services: trip.service ? [trip.service] : [],
                        tip: trip.tip || 0,
                        trips: [trip],
                        total: trip.total || 0,
                        units: trip.endUnit ? [trip.endUnit] : [],
                        visits: 1
                    } as IDelivery;

                    deliveries.push(delivery);
                    deliveryMap.set(key, delivery);
                }
            }
            await this._deliveryService.load(deliveries);
            this._logger.info('Deliveries linked successfully');
        } catch (error) {
            this.handleError('linkDeliveries', error);
            throw error;
        }
    }

    private async linkNameData() {
        try {
            this._logger.info('Linking name data');
            
            let names = await this._nameService.list();
            let trips = await this._tripService.list();

            // group trips by name for single-pass updates
            const tripsByName = groupBy(trips.filter((x: ITrip) => !!x.endAddress && !!x.name), x => x.name as string);

            for (const name of names) {
                const addressTrips = tripsByName.get(name.name) || [];
                if (!addressTrips.length) continue;

                name.addresses = name.addresses || [];
                name.notes = name.notes || [];

                for (const trip of addressTrips) {
                    uniquePush(name.addresses, trip.endAddress as string);

                    if (trip.note) {
                        const note = {
                            date: trip.date,
                            text: trip.note,
                            name: trip.name,
                            address: trip.endAddress
                        } as INote;
                        name.notes.push(note);
                    }
                }

                await this._nameService.update([name]);
            }
            
            this._logger.info('Name data linked successfully');
        } catch (error) {
            this.handleError('linkNameData', error);
            throw error;
        }
    }

    private async linkAddressData() {
        try {
            this._logger.info('Linking address data');
            
            let addresses = await this._addressService.list();
            let trips = await this._tripService.list();

            const tripsByAddress = groupBy(trips.filter((x: ITrip) => !!x.endAddress && !!x.name), x => x.endAddress as string);

            for (const address of addresses) {
                const nameTrips = tripsByAddress.get(address.address) || [];
                if (!nameTrips.length) continue;

                address.names = address.names || [];
                address.notes = address.notes || [];

                for (const trip of nameTrips) {
                    uniquePush(address.names, trip.name as string);

                    if (trip.note) {
                        const note = {
                            date: trip.date,
                            text: trip.note,
                            name: trip.name,
                            address: trip.endAddress
                        } as INote;
                        address.notes.push(note);
                    }
                }

                await this._addressService.append([address]);
            }
            
            this._logger.info('Address data linked successfully');
        } catch (error) {
            this.handleError('linkAddressData', error);
            throw error;
        }
    }

    private async linkPlaceData() {
        try {
            this._logger.info('Linking place data');
            
            let trips = await this._tripService.list();
            let places = await this._placeService.list();

            // Group trips by place for efficient per-place processing
            const tripsByPlace = groupBy(trips.filter((x: ITrip) => !!x.place), x => x.place as string);

            for (const place of places) {
                const placeTrips = tripsByPlace.get(place.place) || [];
                if (!placeTrips.length) continue;

                // Addresses
                place.addresses = place.addresses || [];
                const addrMap = new Map((place.addresses || []).map(a => [a.address, a]));

                for (const tripPlaceAddress of placeTrips.filter(t => t.startAddress)) {
                    const addrKey = tripPlaceAddress.startAddress as string;
                    const existing = addrMap.get(addrKey);
                    if (existing) {
                        existing.lastTrip = tripPlaceAddress.date;
                        existing.trips = (existing.trips || 0) + 1;
                    } else {
                        const address: IAddress = {
                            address: addrKey,
                            trips: 1,
                            lastTrip: tripPlaceAddress.date
                        } as IAddress;
                        place.addresses.push(address);
                        addrMap.set(addrKey, address);
                    }
                }

                if (place.addresses) sort(place.addresses, 'address');

                // Types
                place.types = place.types || [];
                const typeMap = new Map((place.types || []).map(t => [t.type, t]));

                for (const tripPlaceType of placeTrips.filter(t => t.type)) {
                    const typeKey = tripPlaceType.type as string;
                    const existing = typeMap.get(typeKey);
                    if (existing) existing.trips = (existing.trips || 0) + 1;
                    else {
                        const type: IType = { type: typeKey, trips: 1 } as IType;
                        place.types.push(type);
                        typeMap.set(typeKey, type);
                    }
                }

                await this._placeService.update([place]);
            }
            
            this._logger.info('Place data linked successfully');
        } catch (error) {
            this.handleError('linkPlaceData', error);
            throw error;
        }
    }

    async updateAncillaryInfo() {
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

            let trips = await this._tripService.getPreviousDays(2);

            for (let trip of trips) {
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

    private async addIfNotExists(field: string, value: any, service: any) {
        if (!value) return;

        const fieldMap: { [key: string]: string } = {
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
            const newItem = { [searchField]: value };
            await service.add(newItem);
        }
    }
}