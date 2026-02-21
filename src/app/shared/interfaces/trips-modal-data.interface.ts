import { ITrip } from './trip.interface';

/**
 * Trips modal data interface for passing trip data to the modal.
 */
export interface ITripsModalData {
  title: string;
  trips: ITrip[];
}
