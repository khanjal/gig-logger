import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';
import { LogQuickViewComponent } from '@components/log/log-quick-view/log-quick-view.component';
import { LogShiftQuickFormComponent } from '@components/log/log-shift-quick-form/log-shift-quick-form.component';
import { LogTripQuickFormComponent } from '@components/log/log-trip-quick-form/log-trip-quick-form.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { ShiftHelper } from '@helpers/shift.helper';
import { DateHelper } from '@helpers/date.helper';

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, SearchInputComponent, LogQuickViewComponent, LogShiftQuickFormComponent, LogTripQuickFormComponent],
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent {
  // Shifts state: support multiple concurrent shifts (grouped)
  shifts: Array<IShift & { items: ITrip[]; editing?: boolean }> = [];

  // Add Shift form visibility and model
  showAddShiftForm = false;
  newShift: Partial<IShift> = {
    date: DateHelper.toISO(new Date()),
    service: '',
    region: ''
  };
  // Material datepicker model (uses Date)
  newShiftDateModel: Date = new Date();
  nextShiftNumber: number = 1;
  // Pagination for previous shifts
  pageSize: number = 20;
  currentPage: number = 0;
  isLoading: boolean = false;
  noMoreData: boolean = false;

  // Trip state (simple stub)
  showTripFormFor: string | null = null; // UI uid for shift
  trip: Partial<ITrip> = {
    service: '',
    pickupTime: '',
    dropoffTime: '',
    total: 0
  };

  constructor(private _shiftService: ShiftService, private _tripService: TripService) {}

  async ngOnInit(): Promise<void> {
    await this.loadRecentShifts();
  }

  async loadRecentShifts(): Promise<void> {
    if (this.isLoading || this.noMoreData) return;
    this.isLoading = true;
    const recent = await this._shiftService.paginate(this.currentPage, this.pageSize, 'rowId', 'desc');
    if (recent.length < this.pageSize) {
      this.noMoreData = true;
    }
    const mapped = recent.map(s => ({ ...(s as IShift), items: [], editing: false } as any));
    // Load trips under each shift and sort by date desc
    await this.loadTripsForShifts(mapped);
    const combined = [...this.shifts, ...mapped];
    combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    this.shifts = combined;
    this.currentPage++;
    this.isLoading = false;
  }

  private async loadTripsForShifts(chunk: Array<IShift & { items: ITrip[]; editing?: boolean }>): Promise<void> {
    for (const s of chunk) {
      try {
        if (s.key) {
          const trips = await this._tripService.query('key', s.key);
          s.items = trips || [];
        } else {
          s.items = [];
        }
      } catch {
        s.items = [];
      }
    }
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 200;
    if (nearBottom && !this.isLoading && !this.noMoreData) {
      this.loadRecentShifts();
    }
  }

  handleQuickEdit(shiftId?: number) {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (shift) {
      shift.editing = true;
    }
  }

  createShift() {
    this.showAddShiftForm = true;
    // Precompute next number for display based on selected date & service
    this.updateComputedShiftNumber();
  }

  async updateComputedShiftNumber() {
    const dateISO = DateHelper.toISO(this.newShiftDateModel);
    const service = this.newShift.service || '';
    if (!dateISO || !service) {
      this.nextShiftNumber = 1;
      return;
    }
    const shiftsOnDate = await this._shiftService.getShiftsByDate(dateISO);
    this.nextShiftNumber = ShiftHelper.getNextShiftNumber(service, shiftsOnDate);
  }

  async submitNewShift() {
    // Derive next identifiers and defaults
    const last = await this._shiftService.getLastShift();
    const nextRowId = (await this._shiftService.getMaxRowId()) + 1;
    await this.updateComputedShiftNumber();
    const nextNumber = this.nextShiftNumber;

    const dateVal = (this.newShiftDateModel instanceof Date)
      ? DateHelper.toISO(this.newShiftDateModel)
      : (this.newShift.date || DateHelper.toISO(new Date()));
    const days = DateHelper.getDays(this.newShiftDateModel);
    const key = `${days}-${nextNumber}-${this.newShift.service || ''}`;
    const base: IShift & { items: ITrip[]; editing?: boolean } = {
      date: dateVal as string,
      service: this.newShift.service || '',
      region: this.newShift.region || '',
      number: nextNumber,
      active: '',
      finish: '',
      key: key,
      start: '',
      time: '',
      distance: 0,
      trips: 0,
      totalActive: '',
      totalTime: '',
      totalTrips: 0,
      totalDistance: 0,
      totalPay: 0,
      totalTips: 0,
      totalBonus: 0,
      grandTotal: 0,
      totalCash: 0,
      note: '',
      omit: false,
      rowId: nextRowId,
      items: [],
      editing: true
    } as any;

    // Persist and add to UI
    await this._shiftService.add({ ...(base as IShift) });
    this.shifts.unshift(base);
    this.showAddShiftForm = false;
    this.newShift = { date: DateHelper.toISO(new Date()), service: '', region: '' };
    this.newShiftDateModel = new Date();
  }

  // Handlers for quick forms
  async handleQuickShiftRecompute(e: { dateISO: string; service: string }) {
    // Recompute with provided date/service
    this.newShiftDateModel = DateHelper.getDateFromISO(e.dateISO);
    this.newShift.service = e.service;
    await this.updateComputedShiftNumber();
  }

  async handleQuickShiftSubmit(e: { dateISO: string; service: string; region?: string }) {
    this.newShiftDateModel = DateHelper.getDateFromISO(e.dateISO);
    this.newShift.service = e.service;
    this.newShift.region = e.region || '';
    await this.submitNewShift();
  }

  handleQuickTripSubmit(e: { shiftId?: number; service?: string; pickupTime?: string; dropoffTime?: string; total?: number }) {
    if (e.shiftId) {
      this.showTripFormFor = String(e.shiftId);
      this.trip.service = e.service || '';
      this.trip.pickupTime = e.pickupTime || '';
      this.trip.dropoffTime = e.dropoffTime || '';
      this.trip.total = e.total || 0;
      this.saveTrip();
    }
  }

  addTrip(shiftId: number | undefined) {
    this.showTripFormFor = String(shiftId ?? '');
  }

  async saveTrip() {
    // Placeholder: integrate with TripService later
    const shift = this.shifts.find(s => String(s.id ?? '') === this.showTripFormFor);
    if (shift) {
      const trip: ITrip = {
        date: shift.date,
        service: this.trip.service || '',
        pickupTime: this.trip.pickupTime || '',
        dropoffTime: this.trip.dropoffTime || '',
        pay: 0,
        tip: 0,
        bonus: 0,
        cash: 0,
        total: this.trip.total || 0,
        region: shift.region || '',
        note: '',
        distance: 0,
        endAddress: '',
        endUnit: '',
        endOdometer: 0,
        exclude: false,
        duration: '',
        key: '',
        name: '',
        number: 0,
        orderNumber: '',
        place: '',
        startAddress: '',
        startOdometer: 0,
        type: '',
        amountPerDistance: 0,
        amountPerTime: 0
      } as any;
      shift.items.push(trip);
      await this._tripService.add(trip);
    }
    this.trip = { service: '', pickupTime: '', dropoffTime: '', total: 0 };
    this.showTripFormFor = null;
  }

  toggleEdit(shiftUid: string) {
    const shift = this.shifts.find(s => String(s.id ?? '') === shiftUid);
    if (shift) { shift.editing = !shift.editing; }
  }

  addAnotherShift() {
    this.createShift();
  }

  getServiceClass(service?: string): string {
    if (!service) return 'svc-generic';
    const v = service.toLowerCase();
    if (v.includes('uber')) return 'svc-uber';
    if (v.includes('lyft')) return 'svc-lyft';
    if (v.includes('dash') || v.includes('door')) return 'svc-doordash';
    if (v.includes('insta')) return 'svc-instacart';
    if (v.includes('grub')) return 'svc-grubhub';
    if (v.includes('spark')) return 'svc-spark';
    return 'svc-generic';
  }
}
