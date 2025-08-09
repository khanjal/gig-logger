import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IShift } from '@interfaces/shift.interface';
import { CommonModule } from '@angular/common';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { ShiftService } from '@services/sheets/shift.service';
import { ActionEnum } from '@enums/action.enum';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDatepickerToggle } from '@angular/material/datepicker';
import { ITrip } from '@interfaces/trip.interface';
import { TimeInputComponent } from '@inputs/time-input/time-input.component';
import { MatNativeDateModule } from '@angular/material/core';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ShiftHelper } from '@helpers/shift.helper';
import { DateHelper } from '@helpers/date.helper';
import { TripService } from '@services/sheets/trip.service';
import { Router } from '@angular/router';

@Component({
  selector: 'shift-form',
  templateUrl: './shift-form.component.html',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatIcon,
    MatDatepickerModule, MatDatepicker, MatDatepickerToggle, TimeInputComponent,
    MatInputModule, MatNativeDateModule, SearchInputComponent, MatSlideToggleModule,
    MatButtonModule
  ]
})
export class ShiftFormComponent implements OnInit {
  @Input() rowId?: string | null;
  @Output() parentReload = new EventEmitter<any>();
  @Output() editModeExit = new EventEmitter<string | undefined>();

  shiftForm = new FormGroup({
    date: new FormControl(new Date(), Validators.required),
    service: new FormControl('', Validators.required),
    region: new FormControl(''),
    number: new FormControl(),
    distance: new FormControl(),
    active: new FormControl('', [Validators.pattern(/^([0-1]?\d|2[0-3]):[0-5]\d$/)]),
    finish: new FormControl(''),
    start: new FormControl(''),
    time: new FormControl('', [Validators.pattern(/^([0-1]?\d|2[0-3]):[0-5]\d$/)]),
    note: new FormControl(''),
    action: new FormControl(''),
    actionTime: new FormControl(),
    pay: new FormControl(),
    tip: new FormControl(),
    bonus: new FormControl(),
    cash: new FormControl(),
    total: new FormControl(),
    trips: new FormControl(),
    omit: new FormControl(false),
  });

  computedTotals = {
    totalTrips: 0,
    totalPay: 0,
    totalCash: 0,
    totalBonus: 0,
    totalTips: 0
  };

  computedShiftNumber: number = 1;
  shift: IShift | undefined;

  constructor(private shiftService: ShiftService, private tripService: TripService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    const rowId = this.rowId;
    if (rowId && rowId !== 'new') {
      this.shift = await this.shiftService.getByRowId(Number(rowId));
      if (this.shift) {
        this.shiftForm.patchValue({
          date: this.shift.date ? new Date(this.shift.date) : new Date(),
          service: this.shift.service ?? '',
          region: this.shift.region ?? '',
          number: this.shift.number ?? 0,
          distance: this.shift.distance ?? '',
          active: DateHelper.removeSeconds(this.shift.active) ?? '',
          finish: this.shift.finish ?? '',
          start: this.shift.start ?? '',
          time: DateHelper.removeSeconds(this.shift.time) ?? '',
          note: this.shift.note ?? '',
          action: this.shift.action ?? '',
          actionTime: this.shift.actionTime ?? 0,
          pay: this.shift.pay ?? '',
          tip: this.shift.tip ?? '',
          bonus: this.shift.bonus ?? '',
          cash: this.shift.cash ?? '',
          total: this.shift.total ?? '',
          trips: this.shift.trips ?? '',
          omit: this.shift.omit ?? false,
        });
        this.computedShiftNumber = this.shift.number ?? 1; // Set to existing number
        await this.calculateTotals();
      }
    } else {
      this.shiftForm.get('date')?.valueChanges.subscribe(() => {
        this.updateComputedShiftNumber();
      });
      this.shiftForm.get('service')?.valueChanges.subscribe(() => {
        this.updateComputedShiftNumber();
      });
      // Initial calculation for new shift only
      this.updateComputedShiftNumber();
    }
  }

  async updateComputedShiftNumber() {
    // Only update shift number if not editing
    if (this.rowId && this.rowId !== 'new') {
      return;
    }
    const date = this.shiftForm.get('date')?.value;
    const service = this.shiftForm.get('service')?.value;
    if (!date || !service) {
      this.computedShiftNumber = 1;
      return;
    }
    // Convert date to ISO string if needed
    const dateISO = date instanceof Date ? date.toISOString().slice(0, 10) : date;
    const shifts = await this.shiftService.getShiftsByDate(dateISO);
    this.computedShiftNumber = ShiftHelper.getNextShiftNumber(service, shifts);
  }

  async calculateTotals() {
    let trips: ITrip[] = [];
    if (this.shift?.key) {
      trips = await this.tripService.query("key", this.shift.key);
    }
    const totalPayFromTrips = trips.reduce((sum, t) => sum + (t.pay ?? 0), 0);
    const totalCashFromTrips = trips.reduce((sum, t) => sum + (t.cash ?? 0), 0);
    const totalBonusFromTrips = trips.reduce((sum, t) => sum + (t.bonus ?? 0), 0);
    const totalTipsFromTrips = trips.reduce((sum, t) => sum + (t.tip ?? 0), 0);
    this.computedTotals = {
      totalTrips: trips.length + (this.shift?.trips ?? 0),
      totalPay: totalPayFromTrips + (this.shift?.pay ?? 0),
      totalCash: totalCashFromTrips + (this.shift?.cash ?? 0),
      totalBonus: totalBonusFromTrips + (this.shift?.bonus ?? 0),
      totalTips: totalTipsFromTrips + (this.shift?.tip ?? 0)
    };
  }

  async addShift() {
    if (this.shiftForm.valid) {
      const formValue = this.shiftForm.value;
      const newShift: IShift = {
        id: undefined,
        rowId: await this.shiftService.getMaxShiftId() + 1,
        date: formValue.date ? (formValue.date instanceof Date ? formValue.date.toISOString().slice(0, 10) : formValue.date) : '',
        distance: formValue.distance ?? 0,
        active: formValue.active || '',
        finish: formValue.finish || '',
        key: '',
        region: formValue.region || '',
        saved: false,
        service: formValue.service || '',
        number: formValue.number ?? 0,
        start: formValue.start || '',
        time: formValue.time || '',
        trips: formValue.trips ?? 0,
        totalActive: '',
        totalTime: '',
        totalTrips: formValue.trips ?? 0,
        totalDistance: formValue.distance ?? 0,
        totalPay: formValue.pay ?? 0,
        totalTips: formValue.tip ?? 0,
        totalBonus: formValue.bonus ?? 0,
        grandTotal: formValue.total ?? 0,
        totalCash: formValue.cash ?? 0,
        note: formValue.note || '',
        action: ActionEnum.Add,
        actionTime: Date.now(),
        amountPerTrip: 0,
        amountPerDistance: 0,
        amountPerTime: 0,
        pay: formValue.pay ?? 0,
        tip: formValue.tip ?? 0,
        bonus: formValue.bonus ?? 0,
        cash: formValue.cash ?? 0,
        total: formValue.total ?? 0,
        omit: formValue.omit ?? false,
      };
      await this.shiftService.add(newShift);
      this.parentReload.emit();
      this.formReset();
    }
  }

  async editShift() {
    if (this.shiftForm.valid && this.rowId) {
      const formValue = this.shiftForm.value;
      if (this.shift) {
        this.shift.date = formValue.date ? (formValue.date instanceof Date ? formValue.date.toISOString().slice(0, 10) : formValue.date) : '';
        this.shift.service = formValue.service || '';
        this.shift.region = formValue.region || '';
        this.shift.number = formValue.number ?? 0;
        this.shift.distance = formValue.distance ?? 0;
        this.shift.active = formValue.active || '';
        this.shift.finish = formValue.finish || '';
        this.shift.start = formValue.start || '';
        this.shift.time = formValue.time || '';
        this.shift.trips = formValue.trips ?? 0;
        this.shift.totalActive = '';
        this.shift.totalTime = '';
        this.shift.note = formValue.note || '';
        this.shift.action = ActionEnum.Update;
        this.shift.actionTime = Date.now();
        this.shift.saved = false;
        this.shift.amountPerTrip = 0;
        this.shift.amountPerDistance = 0;
        this.shift.amountPerTime = 0;
        this.shift.pay = formValue.pay ?? 0;
        this.shift.tip = formValue.tip ?? 0;
        this.shift.bonus = formValue.bonus ?? 0;
        this.shift.cash = formValue.cash ?? 0;
        this.shift.total = formValue.total ?? 0;
        this.shift.omit = formValue.omit ?? false;

        // Calculate totals from trips
        await this.calculateTotals();
        this.shift.totalTrips = this.computedTotals.totalTrips;
        this.shift.totalDistance = formValue.distance ?? 0; // If you want to sum trip distances, update here
        this.shift.totalPay = this.computedTotals.totalPay;
        this.shift.totalTips = this.computedTotals.totalTips;
        this.shift.totalBonus = this.computedTotals.totalBonus;
        this.shift.grandTotal = (this.computedTotals.totalPay + this.computedTotals.totalTips + this.computedTotals.totalBonus + this.computedTotals.totalCash);
        this.shift.totalCash = this.computedTotals.totalCash;

        await this.shiftService.update([this.shift]);
        this.editModeExit.emit(undefined);
        this.router.navigate(['/shifts']); // Navigate to shifts after update
      }
    }
  }

  formReset() {
    this.shiftForm.reset();
  }

  close() {
    this.editModeExit.emit();
    this.router.navigate(['/shifts']); // Navigate to shifts on cancel
  }

}
