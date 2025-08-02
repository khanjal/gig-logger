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

@Component({
  selector: 'shift-form',
  templateUrl: './shift-form.component.html',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatButton, MatIcon,
    MatDatepickerModule, MatDatepicker, MatDatepickerToggle, TimeInputComponent,
    MatInputModule, MatNativeDateModule, SearchInputComponent, MatSlideToggleModule
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
  shiftKey: string = '';

  constructor(private shiftService: ShiftService, private tripService: TripService) {}

  async ngOnInit(): Promise<void> {
    const rowId = this.rowId;
    if (rowId && rowId !== 'new') {
      const shift = await this.shiftService.getByRowId(Number(rowId));
      if (shift) {
        this.shiftKey = shift.key ?? '';
        this.shiftForm.patchValue({
          date: shift.date ? new Date(shift.date) : new Date(),
          service: shift.service ?? '',
          region: shift.region ?? '',
          number: shift.number ?? 0,
          distance: shift.distance ?? '',
          active: DateHelper.removeSeconds(shift.active) ?? '',
          finish: shift.finish ?? '',
          start: shift.start ?? '',
          time: DateHelper.removeSeconds(shift.time) ?? '',
          note: shift.note ?? '',
          action: shift.action ?? '',
          actionTime: shift.actionTime ?? 0,
          pay: shift.pay ?? '',
          tip: shift.tip ?? '',
          bonus: shift.bonus ?? '',
          cash: shift.cash ?? '',
          total: shift.total ?? '',
          trips: shift.trips ?? '',
          omit: shift.omit ?? false,
        });
        await this.calculateTotals();
      }
    }

    this.shiftForm.get('date')?.valueChanges.subscribe(() => {
      this.updateComputedShiftNumber();
    });
    this.shiftForm.get('service')?.valueChanges.subscribe(() => {
      this.updateComputedShiftNumber();
    });
    // Initial calculation
    this.updateComputedShiftNumber();
  }

  async updateComputedShiftNumber() {
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
    if (this.shiftKey) {
      trips = await this.tripService.query("key", this.shiftKey);
    }
    const tripsTotal = {
      totalTrips: trips.length,
      totalPay: trips.reduce((sum, t) => sum + (t.pay ?? 0), 0),
      totalCash: trips.reduce((sum, t) => sum + (t.cash ?? 0), 0),
      totalBonus: trips.reduce((sum, t) => sum + (t.bonus ?? 0), 0),
      totalTips: trips.reduce((sum, t) => sum + (t.tip ?? 0), 0)
    };
    this.computedTotals = tripsTotal;
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
      const updatedShift: IShift = {
        id: Number(this.rowId),
        rowId: Number(this.rowId),
        key: '',
        saved: false,
        date: formValue.date ? (formValue.date instanceof Date ? formValue.date.toISOString().slice(0, 10) : formValue.date) : '',
        service: formValue.service || '',
        region: formValue.region || '',
        number: formValue.number ?? 0,
        distance: formValue.distance ?? 0,
        active: formValue.active || '',
        finish: formValue.finish || '',
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
        action: ActionEnum.Update,
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
      await this.shiftService.update([updatedShift]);
      this.editModeExit.emit(undefined);
    }
  }

  formReset() {
    this.shiftForm.reset();
  }

  close() {
    this.editModeExit.emit();
  }

}
