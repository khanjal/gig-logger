import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { TripService } from '@services/sheets/trip.service';

@Component({
  selector: 'log-quick-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './log-quick-view.component.html',
  styleUrls: ['./log-quick-view.component.scss']
})
export class LogQuickViewComponent {
  @Input() shifts: Array<IShift & { items: ITrip[]; editing?: boolean; rowId?: number }> = [];
  @Output() addTrip = new EventEmitter<number | undefined>();
  @Output() editShift = new EventEmitter<number | undefined>();

  counts: Record<string, number> = {};
  tripsByKey: Record<string, Array<ITrip & { rowId?: number }>> = {};
  tripTotals: Record<string, number> = {};
  tripAggregates: Record<string, { distance: number; pay: number; tip: number; bonus: number; cash: number; total: number }> = {};
  expanded: Record<number, boolean> = {};
  showTrips: Record<number, boolean> = {};

  constructor(private tripService: TripService) {}

  async ngOnChanges(): Promise<void> {
    await this.computeTrips();
  }

  private async computeTrips(): Promise<void> {
    const keys = Array.from(new Set((this.shifts || []).map(s => s.key).filter(Boolean)));
    for (const key of keys) {
      try {
        const trips = await this.tripService.query('key', key as string);
        this.tripsByKey[key as string] = trips;
        this.counts[key as string] = trips.length;
        this.tripTotals[key as string] = trips.reduce((sum, t) => sum + (t.total || 0), 0);
        this.tripAggregates[key as string] = {
          distance: trips.reduce((sum, t) => sum + (t.distance || 0), 0),
          pay: trips.reduce((sum, t) => sum + (t.pay || 0), 0),
          tip: trips.reduce((sum, t) => sum + (t.tip || 0), 0),
          bonus: trips.reduce((sum, t) => sum + (t.bonus || 0), 0),
          cash: trips.reduce((sum, t) => sum + (t.cash || 0), 0),
          total: trips.reduce((sum, t) => sum + (t.total || 0), 0)
        };
      } catch {
        this.tripsByKey[key as string] = [];
        this.counts[key as string] = 0;
        this.tripTotals[key as string] = 0;
        this.tripAggregates[key as string] = { distance: 0, pay: 0, tip: 0, bonus: 0, cash: 0, total: 0 };
      }
    }
  }

  toggleExpanded(id?: number): void {
    if (id === undefined) return;
    this.expanded[id] = !this.expanded[id];
  }

  toggleTrips(id?: number): void {
    if (id === undefined) return;
    this.showTrips[id] = !this.showTrips[id];
  }

  isExpanded(id?: number): boolean {
    if (id === undefined) return false;
    return !!this.expanded[id];
  }

  isShowTrips(id?: number): boolean {
    if (id === undefined) return false;
    return !!this.showTrips[id];
  }

  onAddTrip(shiftId: number | undefined) {
    this.addTrip.emit(shiftId);
  }

  onEditShift(shiftId: number | undefined) {
    this.editShift.emit(shiftId);
  }
}
