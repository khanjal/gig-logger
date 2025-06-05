import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';

interface DiagnosticItem {
  name: string;
  count: number;
  severity: 'info' | 'warning' | 'error';
  description: string;
  itemType?: 'shift' | 'trip'; // Type of items in the array
  items?: any[]; // Array of problematic shifts/trips
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
    private _tripService: TripService
  ) {}

  async ngOnInit() {
    await this.runDiagnostics();
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
    
    console.log('Diagnostics - Shifts:', shifts);
    console.log('Diagnostics - Trips:', trips);

    // Check for duplicate shifts
    const duplicateShifts = this.findDuplicateShifts(shifts);
    console.log('Duplicate shifts found:', duplicateShifts);    this.dataDiagnostics.push({
      name: 'Duplicate Shifts',
      count: duplicateShifts.length,
      severity: duplicateShifts.length > 0 ? 'warning' : 'info',
      description: 'Shifts with identical dates and keys',
      itemType: 'shift',
      items: duplicateShifts
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
    
    console.log('Final dataDiagnostics:', this.dataDiagnostics);
  }  private findDuplicateShifts(shifts: IShift[]): IShift[] {
    const keyMap = new Map<string, IShift[]>();
    const duplicates: IShift[] = [];

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
      }
    }

    return duplicates;
  }
  private findOrphanedTrips(trips: ITrip[], shifts: IShift[]): ITrip[] {
    const shiftKeys = new Set(shifts.map(s => s.key));
    return trips.filter(t => t.key && !shiftKeys.has(t.key) && !t.exclude);
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
