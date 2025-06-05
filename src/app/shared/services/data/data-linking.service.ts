import { Injectable } from "@angular/core";
import { ITrip } from "@interfaces/trip.interface";
import { IDelivery } from "@interfaces/delivery.interface";
import { INote } from "@interfaces/note.interface";
import { IAddress } from "@interfaces/address.interface";
import { IType } from "@interfaces/type.interface";
import { IName } from "@interfaces/name.interface";
import { IPlace } from "@interfaces/place.interface";
import { IRegion } from "@interfaces/region.interface";
import { IService } from "@interfaces/service.interface";
import { AddressService } from "../sheets/address.service";
import { NameService } from "../sheets/name.service";
import { PlaceService } from "../sheets/place.service";
import { RegionService } from "../sheets/region.service";
import { ServiceService } from "../sheets/service.service";
import { TripService } from "../sheets/trip.service";
import { TypeService } from "../sheets/type.service";
import { DeliveryService } from "../delivery.service";
import { sort } from "@helpers/sort.helper";

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
        private _typeService: TypeService
    ) {}

    private handleError(operation: string, error: any): void {
        console.error(`❌ ${operation} failed:`, {
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
            let deliveries: IDelivery[] = await this._deliveryService.getRemoteDeliveries();

            trips.forEach(async trip => {
                if (!trip.endAddress && !trip.name) {
                    return;
                }

                let delivery: IDelivery | undefined;
                let note: INote | undefined;

                if (trip.note) {
                    note = {} as INote;
                    note.date = trip.date;
                    note.text = trip.note;
                }

                delivery = deliveries.find(x => x.address === trip.endAddress && x.name === trip.name);

                if (delivery){
                    delivery.bonus += trip.bonus,
                    delivery.cash += trip.cash,
                    delivery.pay += trip.pay;
                    delivery.tip += trip.tip;
                    delivery.trips.push(trip);
                    delivery.total += trip.total;
                    delivery.visits++;
                    
                    sort(delivery.trips, '-key');

                    if (trip.date) {
                        delivery.dates.push(trip.date);
                        delivery.dates = [...new Set(delivery.dates)];
                    }
                    
                    if (trip.place) {
                        delivery.places.push(trip.place);
                        delivery.places = [...new Set(delivery.places)].sort();
                    }

                    if (trip.service) {
                        delivery.services.push(trip.service);
                        delivery.services = [...new Set(delivery.services)].sort();
                    }
                    
                    if (trip.endUnit) {
                        delivery.units.push(trip.endUnit);
                        delivery.units = [...new Set(delivery.units)];
                    }

                    if (note) {
                        delivery.notes.push(note);
                    }
                }
                else {
                    delivery = {} as IDelivery;

                    delivery.address = trip.endAddress;
                    delivery.bonus = trip.bonus;
                    delivery.cash = trip.cash;
                    delivery.dates = trip.date ? [trip.date] : [];
                    delivery.name = trip.name;
                    delivery.notes = note ? [note] : [];
                    delivery.pay = trip.pay;
                    delivery.places = trip.place ? [trip.place] : [];
                    delivery.services = trip.service? [trip.service] : [];
                    delivery.tip = trip.tip;
                    delivery.trips = [trip];
                    delivery.total = trip.total;
                    delivery.units = trip.endUnit ? [trip.endUnit] : [];
                    delivery.visits = 1;

                    deliveries.push(delivery);
                }
            });

            await this._deliveryService.loadDeliveries(deliveries);
            console.log('✅ Deliveries linked successfully');
        } catch (error) {
            this.handleError('linkDeliveries', error);
            throw error;
        }
    }

    private async linkNameData() {
        try {
            console.log('🔗 Linking name data...');
            
            let names = await this._nameService.list();
            let trips = await this._tripService.getAll();

            for (let name of names) {
                let addressTrips = trips.filter(x => x.name === name.name && x.endAddress);
                
                for (const trip of addressTrips) {
                    if (!name.addresses) {
                        name.addresses = [];
                    }

                    if (!name.addresses.includes(trip.endAddress)) {
                        name.addresses.push(trip.endAddress);
                    }
                    
                    let note = {} as INote;

                    if (!name.notes) {
                        name.notes = [];
                    }

                    if (trip.note) {
                        note.date = trip.date;
                        note.text = trip.note;
                        note.name = trip.name;
                        note.address = trip.endAddress;

                        name.notes.push(note);
                    }                
                    
                    await this._nameService.update([name]);
                };
            };
            
            console.log('✅ Name data linked successfully');
        } catch (error) {
            this.handleError('linkNameData', error);
            throw error;
        }
    }

    private async linkAddressData() {
        try {
            console.log('🔗 Linking address data...');
            
            let addresses = await this._addressService.list();
            let trips = await this._tripService.getAll();

            for (let address of addresses) {
                let nameTrips = trips.filter(x => x.endAddress === address.address && x.name);

                for (let trip of nameTrips) {
                    if (!address.names) {
                        address.names = [];
                    }

                    if (!address.names.includes(trip.name)) {
                        address.names.push(trip.name);
                    }

                    let note = {} as INote;

                    if (!address.notes) {
                        address.notes = [];
                    }
                    
                    if (trip.note) {
                        note.date = trip.date;
                        note.text = trip.note;
                        note.name = trip.name;
                        note.address = trip.endAddress;

                        address.notes.push(note);
                    }                
                    
                    await this._addressService.append([address])
                };
            };
            
            console.log('✅ Address data linked successfully');
        } catch (error) {
            this.handleError('linkAddressData', error);
            throw error;
        }
    }

    private async linkPlaceData() {
        try {
            console.log('🔗 Linking place data...');
            
            let trips = await this._tripService.getAll();
            let places = await this._placeService.list();

            for (let place of places) {
                // Addresses
                let tripPlaceAddresses = trips.filter(x => x.place === place.place && x.startAddress);

                for (const tripPlaceAddress of tripPlaceAddresses) {
                    if (!place.addresses) {
                        place.addresses = [];
                    }

                    let placeAddress = place.addresses.find(x => x.address === tripPlaceAddress.startAddress);

                    if (placeAddress) {
                        placeAddress.lastTrip = tripPlaceAddress.date;
                        placeAddress.trips++;
                    }
                    else {
                        let address: IAddress = {} as IAddress;
                        address.address = tripPlaceAddress.startAddress;
                        address.trips = 1;
                        address.lastTrip = tripPlaceAddress.date;
                        place.addresses.push(address);
                    }
                };

                if (place.addresses) {
                    sort(place.addresses, 'address');
                }

                // Types
                let tripPlaceTypes = trips.filter(x => x.place === place.place && x.type);

                for (const tripPlaceType of tripPlaceTypes) {
                    if (!place.types) {
                        place.types = [];
                    }
                    
                    let placeType = place.types.find(x => x.type === tripPlaceType.type);

                    if (placeType) {
                        placeType.trips++;
                    }
                    else {
                        let type: IType = {} as IType;
                        type.type = tripPlaceType.type;
                        type.trips = 1;
                        place.types.push(type);    
                    }
                };

                await this._placeService.update([place]);
            };
            
            console.log('✅ Place data linked successfully');
        } catch (error) {
            this.handleError('linkPlaceData', error);
            throw error;
        }
    }

    async updateAncillaryInfo() {
        try {
            console.log('🔄 Updating ancillary info...');
            
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
            
            console.log('✅ Ancillary info updated successfully');
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