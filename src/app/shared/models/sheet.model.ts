import { AddressModel } from "./address.model";
import { NameModel } from "./name.model";
import { PlaceModel } from "./place.model";
import { ServiceModel } from "./service.model";
import { ShiftModel } from "./shift.model";
import { TripModel } from "./trip.model";

export class SheetModel {
    addresses: AddressModel[] = [];
    names: NameModel[] = [];
    places: PlaceModel[] = [];
    services: ServiceModel[] = [];
    shifts: ShiftModel[] = [];
    trips: TripModel[] = [];

    lastUpdates: Date = new Date;
}