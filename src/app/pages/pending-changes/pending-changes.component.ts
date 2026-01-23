import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';
import { ShiftsQuickViewComponent } from '@components/shifts/shifts-quick-view/shifts-quick-view.component';
import { MatDialog } from '@angular/material/dialog';
import { TripFormComponent } from '@components/trips/trip-form/trip-form.component';
import { ShiftFormComponent } from '@components/shifts/shift-form/shift-form.component';

@Component({
  selector: 'app-pending-changes',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatListModule, MatButtonModule, MatIconModule, RouterModule, TripsQuickViewComponent, ShiftsQuickViewComponent],
  templateUrl: './pending-changes.component.html',
  styleUrls: ['./pending-changes.component.scss']
})
export class PendingChangesComponent implements OnInit {
  trips: any[] = [];
  shifts: any[] = [];
  expandedShifts = false;
  expandedTrips = true;
  private querySub: any;

  constructor(
    private unsavedService: UnsavedDataService,
    private tripService: TripService,
    private shiftService: ShiftService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();

    // react to query param changes so navigation from the sync indicator works
    this.querySub = this.route.queryParams.subscribe(params => {
      const section = params['section'];
      this.handleSection(section);
    });
  }

  ngOnDestroy(): void {
    if (this.querySub) this.querySub.unsubscribe();
  }

  private handleSection(section?: string): void {
    if (!section) return;
    if (section === 'shifts') {
      this.expandedShifts = true;
      this.expandedTrips = false;
    } else if (section === 'trips') {
      this.expandedTrips = true;
      this.expandedShifts = false;
    }

    // Wait a tick for panels to expand/collapse, then scroll
    setTimeout(() => {
      const el = document.getElementById(`${section}-panel`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  public async load(): Promise<void> {
    try {
      this.trips = await this.tripService.getUnsaved();
      this.shifts = await this.shiftService.getUnsavedShifts();
    } catch (err) {
      this.trips = [];
      this.shifts = [];
    }
  }

  openTripEditor(t: any): void {
    this.dialog
      .open(TripFormComponent, {
        width: '720px',
        maxHeight: 'calc(100vh - 96px)',
        panelClass: ['custom-modalbox', 'responsive-dialog'],
        data: { id: t.id, rowId: t.rowId }
      })
      .afterClosed()
      .subscribe(() => this.load());
  }

  openShiftEditor(s: any): void {
    this.dialog
      .open(ShiftFormComponent, {
        width: '720px',
        maxHeight: 'calc(100vh - 96px)',
        panelClass: ['custom-modalbox', 'responsive-dialog'],
        data: { id: s.id, rowId: s.rowId }
      })
      .afterClosed()
      .subscribe(() => this.load());
  }
}
