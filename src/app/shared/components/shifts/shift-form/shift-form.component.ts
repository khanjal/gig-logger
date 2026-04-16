import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IShift } from '@interfaces/shift.interface';
import { CommonModule } from '@angular/common';
import { ShiftService } from '@services/sheets/shift.service';
import { LoggerService } from '@services/logger.service';
import { ActionEnum } from '@enums/action.enum';
import { ITrip } from '@interfaces/trip.interface';
import { BaseDatepickerComponent } from '@components/base/base-datepicker/base-datepicker.component';
import { TimeInputComponent } from '@inputs/time-input/time-input.component';
import { MatNativeDateModule } from '@angular/material/core';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ShiftHelper } from '@helpers/shift.helper';
import { DateHelper } from '@helpers/date.helper';
import { NumberHelper } from '@helpers/number.helper';
import { TripService } from '@services/sheets/trip.service';
import { Router } from '@angular/router';
import { BaseFabButtonComponent, BaseInputComponent } from '@components/base';
import { updateAction } from '@utils/action.utils';

@Component({
  selector: 'shift-form',
  templateUrl: './shift-form.component.html',
  styleUrls: ['./shift-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    BaseDatepickerComponent, TimeInputComponent,
    MatNativeDateModule, SearchInputComponent, MatSlideToggleModule,
    BaseFabButtonComponent, BaseInputComponent
  ]
})
export class ShiftFormComponent implements OnInit {
  @Input() rowId?: string | null;
  @Output() parentReload = new EventEmitter<any>();
  @Output() editModeExit = new EventEmitter<string>();

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
    totalTips: 0,
    totalDistance: 0
  };

  computedShiftNumber: number = 1;
  shift: IShift | undefined;
  maxRowId: number = 1;

  constructor(
    private shiftService: ShiftService,
    private tripService: TripService,
    private router: Router,
    private logger: LoggerService
  ) {}

  async ngOnInit(): Promise<void> {
    this.maxRowId = await this.shiftService.getMaxRowId() || 1;
    const rowId = this.rowId;
    if (rowId && rowId !== 'new') {
      this.shift = await this.shiftService.getByRowId(Number(rowId));
      if (this.shift) {
        this.shiftForm.patchValue({
          date: this.shift.date ? DateHelper.parseLocalDate(this.shift.date) : new Date(),
          service: this.shift.service ?? '',
          region: this.shift.region ?? '',
          number: this.shift.number ?? 0,
          distance: this.shift.distance ?? null,
          active: DateHelper.removeSeconds(this.shift.active) ?? '',
          finish: this.shift.finish ?? '',
          start: this.shift.start ?? '',
          time: DateHelper.removeSeconds(this.shift.time) ?? '',
          note: this.shift.note ?? '',
          action: this.shift.action ?? '',
          actionTime: this.shift.actionTime ?? 0,
          pay: this.shift.pay ?? null,
          tip: this.shift.tip ?? null,
          bonus: this.shift.bonus ?? null,
          cash: this.shift.cash ?? null,
          total: this.shift.total ?? null,
          trips: this.shift.trips ?? null,
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
      
      // Load last shift's service and region as defaults
      const lastShift = await this.shiftService.getLastShift();
      if (lastShift && lastShift.service) {
        this.shiftForm.patchValue({
          service: lastShift.service,
          region: lastShift.region || ''
        });
      }
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

  async calculateTotals(shiftKey?: string) {
    let trips: ITrip[] = [];
    const keyToQuery = shiftKey ?? this.shift?.key;
    if (keyToQuery) {
      trips = await this.tripService.query("key", keyToQuery);
    }
    this.computedTotals = {
      totalTrips: trips.length,
      totalPay: trips.reduce((sum, t) => sum + Number(t.pay ?? 0), 0),
      totalCash: trips.reduce((sum, t) => sum + Number(t.cash ?? 0), 0),
      totalBonus: trips.reduce((sum, t) => sum + Number(t.bonus ?? 0), 0),
      totalTips: trips.reduce((sum, t) => sum + Number(t.tip ?? 0), 0),
      totalDistance: trips.reduce((sum, t) => sum + Number(t.distance ?? 0), 0)
    };
  }

  async addShift() {
    if (!this.shiftForm.valid) return;

    const formValue = this.shiftForm.value;
    // Generate key for new shift using DateHelper.getDays()
    const days = DateHelper.getDays(formValue.date ?? new Date());
    const key = `${days}-${this.computedShiftNumber}-${formValue.service}`;
    const newShift: IShift = {
      id: undefined,
      rowId: this.maxRowId + 1,
      date: formValue.date ? (formValue.date instanceof Date ? formValue.date.toISOString().slice(0, 10) : formValue.date) : '',
      distance: formValue.distance,
      active: formValue.active || '',
      finish: formValue.finish || '',
      key: key,
      region: formValue.region || '',
      saved: false,
      service: formValue.service || '',
      number: this.computedShiftNumber,
      start: formValue.start || '',
      time: formValue.time || '',
      trips: formValue.trips,
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
      pay: formValue.pay,
      tip: formValue.tip,
      bonus: formValue.bonus,
      cash: formValue.cash,
      total: formValue.total,
      omit: formValue.omit ?? false,
    };

    await this.shiftService.add(newShift);
    this.parentReload.emit();
    this.formReset();
  }

  async editShift() {
    if (this.shiftForm.valid && this.rowId) {
      const formValue = this.shiftForm.value;
      if (this.shift) {
        this.logger.debug('Editing shift with form value:', formValue);
        const oldKey = this.shift.key;
        const updatedDate = formValue.date
          ? (formValue.date instanceof Date ? formValue.date.toISOString().slice(0, 10) : formValue.date)
          : '';
        const updatedService = formValue.service || '';
        const currentNumber = this.shift.number ?? 1;
        const resolvedNumber = await this.resolveShiftNumberForEdit(updatedDate, updatedService, currentNumber);
        const days = DateHelper.getDays(formValue.date ?? new Date());
        const newKey = `${days}-${resolvedNumber}-${updatedService}`;

        this.shift.date = updatedDate;
        this.shift.service = updatedService;
        this.shift.region = formValue.region || '';
        this.shift.number = resolvedNumber;
        this.shift.distance = NumberHelper.toNullableNumber(formValue.distance);
        this.shift.active = formValue.active || '';
        this.shift.finish = formValue.finish || '';
        this.shift.start = formValue.start || '';
        this.shift.time = formValue.time || '';
        this.shift.trips = NumberHelper.toNullableNumber(formValue.trips);
        this.shift.totalActive = '';
        this.shift.totalTime = '';
        this.shift.note = formValue.note || '';
        this.shift.action = ActionEnum.Update;
        this.shift.actionTime = Date.now();
        this.shift.saved = false;
        // this.shift.amountPerTrip = 0;
        // this.shift.amountPerDistance = 0;
        // this.shift.amountPerTime = 0;
        this.shift.pay = NumberHelper.toNullableNumber(formValue.pay);
        this.shift.tip = NumberHelper.toNullableNumber(formValue.tip);
        this.shift.bonus = NumberHelper.toNullableNumber(formValue.bonus);
        this.shift.cash = NumberHelper.toNullableNumber(formValue.cash);
        this.shift.omit = formValue.omit ?? false;
        this.shift.key = newKey;
        this.computedShiftNumber = resolvedNumber;

        // Use the old key so existing linked trips are included before re-keying.
        await this.calculateTotals(oldKey || newKey);
        this.shift.totalTrips = this.computedTotals.totalTrips + Number(formValue.trips ?? 0);
        this.shift.totalDistance = this.computedTotals.totalDistance + Number(formValue.distance ?? 0);
        this.shift.totalPay = this.computedTotals.totalPay + Number(formValue.pay ?? 0);
        this.shift.totalTips = this.computedTotals.totalTips + Number(formValue.tip ?? 0);
        this.shift.totalBonus = this.computedTotals.totalBonus + Number(formValue.bonus ?? 0);
        this.shift.totalCash = this.computedTotals.totalCash + Number(formValue.cash ?? 0);
        this.shift.grandTotal = (
          this.shift.totalPay +
          this.shift.totalTips +
          this.shift.totalBonus +
          this.shift.totalCash
        );

        // If identifying fields changed, update all associated trips.
        if (oldKey && oldKey !== newKey) {
          const trips = await this.tripService.query("key", oldKey);

          for (const trip of trips) {
            trip.date = this.shift.date;
            trip.service = this.shift.service;
            trip.number = this.shift.number;
            trip.key = newKey;
            updateAction(trip, ActionEnum.Update);
          }

          if (trips.length > 0) {
            await this.tripService.update(trips);
          }
        }

        this.logger.debug('Updated shift:', this.shift);

        await this.shiftService.update([this.shift]);
        this.editModeExit.emit(this.shift.rowId?.toString() || '');
        this.formReset();
      }
    }
  }

  private async resolveShiftNumberForEdit(dateISO: string, service: string, fallbackNumber: number): Promise<number> {
    if (!dateISO || !service || !this.shift) {
      return fallbackNumber;
    }

    const sameDateShifts = await this.shiftService.getShiftsByDate(dateISO);
    const otherShifts = sameDateShifts.filter(shift => shift.rowId !== this.shift?.rowId);
    const hasNumberCollision = otherShifts.some(
      shift => shift.service === service && shift.number === fallbackNumber
    );

    if (!hasNumberCollision) {
      return fallbackNumber;
    }

    return ShiftHelper.getNextShiftNumber(service, otherShifts);
  }

  formReset() {
    this.shiftForm.reset({ date: new Date() });
    this.shiftService.getLastShift().then(lastShift => {
      if (lastShift && lastShift.service) {
        this.shiftForm.patchValue({
          service: lastShift.service,
          region: lastShift.region || ''
        });
      }
    });
  }

  close() {
    if (this.rowId && this.rowId !== 'new') {
      // If we're editing an existing shift, emit editModeExit to navigate properly
      this.editModeExit.emit(this.rowId);
    } else {
      // If we're adding a new shift, just reload the parent
      this.parentReload.emit();
    }
    this.formReset();
  }

}
