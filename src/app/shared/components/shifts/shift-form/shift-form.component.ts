import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IShift } from '@interfaces/shift.interface';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { ShiftService } from '@services/sheets/shift.service';
import { ActionEnum } from '@enums/action.enum';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDatepickerToggle } from '@angular/material/datepicker';
import { ITrip } from '@interfaces/trip.interface';
import { TimeInputComponent } from '@inputs/time-input/time-input.component';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'shift-form',
  templateUrl: './shift-form.component.html',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatButton, MatIcon,
    MatSelect, MatOption, MatDatepickerModule, MatDatepicker, MatDatepickerToggle, TimeInputComponent,
    MatInputModule, MatNativeDateModule
  ]
})
export class ShiftFormComponent implements OnInit {
  @Input() data?: IShift;
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
  });

  computedTotals = {
    totalTrips: 0,
    totalPay: 0,
    totalCash: 0,
    totalBonus: 0,
    totalTips: 0
  };

  serviceOptions: string[] = ['Uber', 'Lyft', 'DoorDash'];
  regionOptions: string[] = ['Downtown', 'Uptown', 'Suburbs'];

  constructor(private shiftService: ShiftService) {}

  async ngOnInit(): Promise<void> {
    if (this.data) {
      // Patch only form fields, and ensure date is a Date object
      this.shiftForm.patchValue({
        date: this.data.date ? new Date(this.data.date) : new Date(),
        service: this.data.service ?? '',
        region: this.data.region ?? '',
        number: this.data.number ?? 0,
        distance: this.data.distance ?? 0,
        active: this.data.active ?? '',
        finish: this.data.finish ?? '',
        start: this.data.start ?? '',
        time: this.data.time ?? '',
        note: this.data.note ?? '',
        action: this.data.action ?? '',
        actionTime: this.data.actionTime ?? 0,
        pay: this.data.pay ?? 0,
        tip: this.data.tip ?? 0,
        bonus: this.data.bonus ?? 0,
        cash: this.data.cash ?? 0,
        total: this.data.total ?? 0,
        trips: this.data.trips ?? 0,
      });
      await this.calculateTotals();
    }
  }

  async calculateTotals() {
    // Fetch trips linked to this shift (by key or rowId)
    let trips: ITrip[] = [];
    if (this.data?.key) {
      // You may need to inject TripService if not already
      // Example: trips = await this.tripService.query('key', this.data.key);
    }
    // Fallback: trips = [];
    // Sum up totals from trips and shift fields
    const tripsTotal = {
      totalTrips: trips.length,
      totalPay: trips.reduce((sum, t) => sum + (t.pay ?? 0), 0),
      totalCash: trips.reduce((sum, t) => sum + (t.cash ?? 0), 0),
      totalBonus: trips.reduce((sum, t) => sum + (t.bonus ?? 0), 0),
      totalTips: trips.reduce((sum, t) => sum + (t.tip ?? 0), 0)
    };
    this.computedTotals = {
      totalTrips: (this.data?.totalTrips ?? 0) + tripsTotal.totalTrips,
      totalPay: (this.data?.totalPay ?? 0) + tripsTotal.totalPay,
      totalCash: (this.data?.totalCash ?? 0) + tripsTotal.totalCash,
      totalBonus: (this.data?.totalBonus ?? 0) + tripsTotal.totalBonus,
      totalTips: (this.data?.totalTips ?? 0) + tripsTotal.totalTips
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
      };
      await this.shiftService.add(newShift);
      this.parentReload.emit();
      this.formReset();
    }
  }

  async editShift() {
    if (this.shiftForm.valid && this.data?.id) {
      const formValue = this.shiftForm.value;
      const updatedShift: IShift = {
        ...this.data,
        ...formValue,
        date: formValue.date ? (formValue.date instanceof Date ? formValue.date.toISOString().slice(0, 10) : formValue.date) : this.data.date,
        distance: formValue.distance ?? this.data.distance,
        active: formValue.active || this.data.active,
        finish: formValue.finish || this.data.finish,
        key: this.data.key || '',
        region: formValue.region || this.data.region,
        saved: this.data.saved,
        service: formValue.service || this.data.service,
        number: formValue.number ?? this.data.number,
        start: formValue.start || this.data.start,
        time: formValue.time || this.data.time,
        trips: this.data.trips ?? 0,
        totalActive: this.data.totalActive || '',
        totalTime: this.data.totalTime || '',
        totalTrips: formValue.trips ?? this.data.totalTrips,
        totalDistance: formValue.distance ?? this.data.totalDistance,
        totalPay: formValue.pay ?? this.data.totalPay,
        totalTips: formValue.tip ?? this.data.totalTips,
        totalBonus: formValue.bonus ?? this.data.totalBonus,
        grandTotal: formValue.total ?? this.data.grandTotal,
        totalCash: formValue.cash ?? this.data.totalCash,
        note: formValue.note || this.data.note,
        action: ActionEnum.Update,
        actionTime: Date.now(),
        amountPerTrip: this.data.amountPerTrip ?? 0,
        amountPerDistance: this.data.amountPerDistance ?? 0,
        amountPerTime: this.data.amountPerTime ?? 0,
        pay: formValue.pay ?? this.data.pay ?? 0,
        tip: formValue.tip ?? this.data.tip ?? 0,
        bonus: formValue.bonus ?? this.data.bonus ?? 0,
        cash: formValue.cash ?? this.data.cash ?? 0,
        total: formValue.total ?? this.data.total ?? 0,
      };
      await this.shiftService.update([updatedShift]);
      this.editModeExit.emit();
    }
  }

  formReset() {
    this.shiftForm.reset();
  }

  close() {
    this.editModeExit.emit();
  }

}
