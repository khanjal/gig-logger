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
    try {
      await this.checkDataIntegrity();
    } finally {
      this.isLoading = false;
    }
  }
  private async checkDataIntegrity() {
    const shifts = await this._shiftService.list();
    const trips = await this._tripService.list();    // Check for duplicate shifts
    const duplicateShifts = this.findDuplicateShifts(shifts);
    this.dataDiagnostics.push({
      name: 'Duplicate Shifts',
      count: duplicateShifts.length,
      severity: duplicateShifts.length > 0 ? 'warning' : 'info',
      description: 'Shifts with identical dates and keys',
      items: duplicateShifts
    });    
    
    // Check for empty shifts
    const emptyShifts = shifts.filter((s: any) => !s.start && !s.finish && s.trips === 0);

    this.dataDiagnostics.push({
      name: 'Empty Shifts',
      count: emptyShifts.length,
      severity: emptyShifts.length > 0 ? 'warning' : 'info',
      description: 'Shifts with zero trips',
      items: emptyShifts
    });

    // Check for orphaned trips
    const orphanedTrips = this.findOrphanedTrips(trips, shifts);
    this.dataDiagnostics.push({
      name: 'Orphaned Trips',
      count: orphanedTrips.length,
      severity: orphanedTrips.length > 0 ? 'error' : 'info',
      description: 'Trips not associated with any shift',
      items: orphanedTrips
    });
  }

  private findDuplicateShifts(shifts: IShift[]): IShift[] {
    const seen = new Set<string>();
    const duplicates: IShift[] = [];

    for (const shift of shifts) {
      const key = `${shift.date}-${shift.key}`;
      if (seen.has(key)) {
        duplicates.push(shift);
      } else {
        seen.add(key);
      }
    }

    return duplicates;
  }

  private findOrphanedTrips(trips: ITrip[], shifts: IShift[]): ITrip[] {
    const shiftKeys = new Set(shifts.map(s => s.key));
    return trips.filter(t => t.key && !shiftKeys.has(t.key));
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
