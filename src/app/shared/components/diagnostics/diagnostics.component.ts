import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { AddressService } from '@services/sheets/address.service';
import { PlaceService } from '@services/sheets/place.service';
import { NameService } from '@services/sheets/name.service';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { IAddress } from '@interfaces/address.interface';
import { IPlace } from '@interfaces/place.interface';
import { IName } from '@interfaces/name.interface';

interface DiagnosticItem {
  name: string;
  count: number;
  severity: 'info' | 'warning' | 'error';
  description: string;
  itemType?: 'shift' | 'trip' | 'address' | 'place' | 'name'; // Type of items in the array
  items?: any[]; // Array of problematic shifts/trips/addresses/places/names
  groups?: any[][]; // Grouped duplicates for better display
}

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './diagnostics.component.html',
  styleUrl: './diagnostics.component.scss'
})
export class DiagnosticsComponent implements OnInit {
  dataDiagnostics: DiagnosticItem[] = [];
  isLoading = false;
  constructor(
    private _shiftService: ShiftService,
    private _tripService: TripService,
    private _addressService: AddressService,
    private _placeService: PlaceService,
    private _nameService: NameService
  ) {}
  ngOnInit() {
    // Diagnostics will only run when the user clicks the "Run Diagnostics" button
  }
  async runDiagnostics() {
    this.isLoading = true;
    this.dataDiagnostics = []; // Clear previous results
    try {
      await this.checkDataIntegrity();
    } finally {
      this.isLoading = false;
    }
  }
    private async checkDataIntegrity() {
    const shifts = await this._shiftService.list();
    const trips = await this._tripService.list();
    const addresses = await this._addressService.list();
    const places = await this._placeService.list();
    const names = await this._nameService.list();
    
    // Check for duplicate shifts
    const duplicateShiftsResult = this.findDuplicateShifts(shifts);
    console.log('Duplicate shifts found:', duplicateShiftsResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Shifts',
      count: duplicateShiftsResult.items.length,
      severity: duplicateShiftsResult.items.length > 0 ? 'warning' : 'info',
      description: 'Shifts with identical dates and keys',
      itemType: 'shift',
      items: duplicateShiftsResult.items,
      groups: duplicateShiftsResult.groups
    });
    
    // Check for empty shifts
    const emptyShifts = shifts.filter((s: IShift) => !s.start && !s.finish && s.trips === 0 && s.totalTrips === 0);
    console.log('Empty shifts found:', emptyShifts);    this.dataDiagnostics.push({
      name: 'Empty Shifts',
      count: emptyShifts.length,
      severity: emptyShifts.length > 0 ? 'warning' : 'info',
      description: 'Shifts with zero trips',
      itemType: 'shift',
      items: emptyShifts
    });

    // Check for orphaned trips
    const orphanedTrips = this.findOrphanedTrips(trips, shifts);
    console.log('Orphaned trips found:', orphanedTrips);    this.dataDiagnostics.push({
      name: 'Orphaned Trips',
      count: orphanedTrips.length,
      severity: orphanedTrips.length > 0 ? 'error' : 'info',
      description: 'Trips not associated with any shift',
      itemType: 'trip',
      items: orphanedTrips
    });

    // Check for duplicate places with different casing
    const duplicatePlacesResult = this.findDuplicatePlaces(places);
    console.log('Duplicate places found:', duplicatePlacesResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Places',
      count: duplicatePlacesResult.items.length,
      severity: duplicatePlacesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Places with different casing or variations',
      itemType: 'place',
      items: duplicatePlacesResult.items,
      groups: duplicatePlacesResult.groups
    });

    // Check for duplicate addresses with different casing/variations
    const duplicateAddressesResult = this.findDuplicateAddresses(addresses);
    console.log('Duplicate addresses found:', duplicateAddressesResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Addresses',
      count: duplicateAddressesResult.items.length,
      severity: duplicateAddressesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Addresses with different casing or partial matches',
      itemType: 'address',
      items: duplicateAddressesResult.items,
      groups: duplicateAddressesResult.groups
    });

    // Check for duplicate names with different casing
    const duplicateNamesResult = this.findDuplicateNames(names);
    console.log('Duplicate names found:', duplicateNamesResult);
    this.dataDiagnostics.push({
      name: 'Duplicate Names',
      count: duplicateNamesResult.items.length,
      severity: duplicateNamesResult.items.length > 0 ? 'warning' : 'info',
      description: 'Names with different casing or variations',
      itemType: 'name',
      items: duplicateNamesResult.items,
      groups: duplicateNamesResult.groups
    });
    
    console.log('Final dataDiagnostics:', this.dataDiagnostics);
  }

  private findDuplicateShifts(shifts: IShift[]): { items: IShift[], groups: IShift[][] } {
    const keyMap = new Map<string, IShift[]>();
    const duplicates: IShift[] = [];
    const duplicateGroups: IShift[][] = [];

    // Group shifts by key
    for (const shift of shifts) {
      const key = shift.key;
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(shift);
    }

    // Find all shifts that have duplicates (groups with more than 1 shift)
    for (const [key, shiftGroup] of keyMap) {
      if (shiftGroup.length > 1) {
        duplicates.push(...shiftGroup);
        duplicateGroups.push(shiftGroup);
      }
    }

    return { items: duplicates, groups: duplicateGroups };
  }

  private findOrphanedTrips(trips: ITrip[], shifts: IShift[]): ITrip[] {
    const shiftKeys = new Set(shifts.map(s => s.key));
    return trips.filter(t => t.key && !shiftKeys.has(t.key) && !t.exclude);
  }  private findDuplicatePlaces(places: IPlace[]): { items: IPlace[], groups: IPlace[][] } {
    const duplicates: IPlace[] = [];
    const duplicateGroups: IPlace[][] = [];
    const processedPlaces = new Set<number>();

    for (let i = 0; i < places.length; i++) {
      if (processedPlaces.has(i)) continue;
      
      const place1 = places[i];
      if (!place1.place || place1.place.trim().length < 2) continue;
      
      const matchingPlaces: IPlace[] = [place1];
      
      for (let j = i + 1; j < places.length; j++) {
        if (processedPlaces.has(j)) continue;
        
        const place2 = places[j];
        if (!place2.place || place2.place.trim().length < 2) continue;
        
        // Case-insensitive exact match
        if (place1.place.toLowerCase().trim() === place2.place.toLowerCase().trim()) {
          matchingPlaces.push(place2);
          processedPlaces.add(j);
        }
      }
      
      // If we found duplicates, add them all
      if (matchingPlaces.length > 1) {
        duplicates.push(...matchingPlaces);
        duplicateGroups.push(matchingPlaces);
        processedPlaces.add(i);
      }
    }

    return { items: duplicates, groups: duplicateGroups };
  }

  private findDuplicateAddresses(addresses: IAddress[]): { items: IAddress[], groups: IAddress[][] } {
    const duplicates: IAddress[] = [];
    const duplicateGroups: IAddress[][] = [];
    const processedAddresses = new Set<number>();

    for (let i = 0; i < addresses.length; i++) {
      if (processedAddresses.has(i)) continue;
      
      const address1 = addresses[i];
      if (!address1.address || address1.address.trim().length < 5) continue;
      
      const matchingAddresses: IAddress[] = [address1];
      
      for (let j = i + 1; j < addresses.length; j++) {
        if (processedAddresses.has(j)) continue;
        
        const address2 = addresses[j];
        if (!address2.address || address2.address.trim().length < 5) continue;
        
        const addr1Lower = address1.address.toLowerCase().trim();
        const addr2Lower = address2.address.toLowerCase().trim();
        
        // Split addresses on comma and get first elements
        const addr1Parts = addr1Lower.split(',').map(part => part.trim());
        const addr2Parts = addr2Lower.split(',').map(part => part.trim());
        
        // Skip comparison if first elements are different AND second elements are the same
        if (addr1Parts[0] !== addr2Parts[0] && 
            addr1Parts.length > 1 && addr2Parts.length > 1 && 
            addr1Parts[1] === addr2Parts[1]) {
          continue;
        }
        
        // Check for exact match or partial match (one contains the other)
        if (addr1Lower === addr2Lower || 
            addr1Lower.includes(addr2Lower) || 
            addr2Lower.includes(addr1Lower)) {
          matchingAddresses.push(address2);
          processedAddresses.add(j);
        }
      }
      
      // If we found duplicates, add them all
      if (matchingAddresses.length > 1) {
        duplicates.push(...matchingAddresses);
        duplicateGroups.push(matchingAddresses);
        processedAddresses.add(i);
      }
    }

    return { items: duplicates, groups: duplicateGroups };
  }

  private findDuplicateNames(names: IName[]): { items: IName[], groups: IName[][] } {
    const duplicates: IName[] = [];
    const duplicateGroups: IName[][] = [];
    const processedNames = new Set<number>();

    for (let i = 0; i < names.length; i++) {
      if (processedNames.has(i)) continue;
      
      const name1 = names[i];
      if (!name1.name || name1.name.trim().length < 2) continue;
      
      const matchingNames: IName[] = [name1];
      
      for (let j = i + 1; j < names.length; j++) {
        if (processedNames.has(j)) continue;
        
        const name2 = names[j];
        if (!name2.name || name2.name.trim().length < 2) continue;
        
        // Case-insensitive exact match
        if (name1.name.toLowerCase().trim() === name2.name.toLowerCase().trim()) {
          matchingNames.push(name2);
          processedNames.add(j);
        }
      }
      
      // If we found duplicates, add them all
      if (matchingNames.length > 1) {
        duplicates.push(...matchingNames);
        duplicateGroups.push(matchingNames);
        processedNames.add(i);
      }
    }

    return { items: duplicates, groups: duplicateGroups };
  }
  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'error': return 'warn';
      case 'warning': return 'accent';
      default: return 'primary';
    }
  }
}
