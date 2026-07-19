import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openSnackbar } from '@utils/snackbar.util';
import { DateHelper } from '@helpers/date.helper';
import { CurrentAverageStateService } from '@services/current-average-state.service';
import { CurrencyPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-current-average',
    templateUrl: './current-average.component.html',
    styleUrls: ['./current-average.component.scss'],
    standalone: true,
  imports: [MatIcon, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CurrentAverageComponent {
  private _snackBar = inject(MatSnackBar);
  private currentAverageState = inject(CurrentAverageStateService);

  private _date: string = DateHelper.toISO();

  @Input() public set date(value: string) {
    this._date = value || DateHelper.toISO();
    this.currentAverageState.setDate(this._date);
  }

  public get date(): string {
    return this._date;
  }

  public get currentDayAmount(): number {
    return this.currentAverageState.currentDayAmount();
  }

  public get currentMonthAmount(): number {
    return this.currentAverageState.currentMonthAmount();
  }

  public get currentWeekAmount(): number {
    return this.currentAverageState.currentWeekAmount();
  }

  public get dailyAverage(): number {
    return this.currentAverageState.dailyAverage();
  }

  public get weeklyAverage(): number {
    return this.currentAverageState.weeklyAverage();
  }

  public get monthlyAverage(): number {
    return this.currentAverageState.monthlyAverage();
  }

  public showDailyAverage = true;
  public showWeeklyAverage = false;
  public showMonthlyAverage = false;

  constructor() {
      this.currentAverageState.setDate(this._date);
    }

  public toggle() {
    const states = ['Daily', 'Weekly', 'Monthly'];
    const currentIndex = states.findIndex(state => this[`show${state}Average` as keyof CurrentAverageComponent]);
    const nextIndex = (currentIndex + 1) % states.length;
  
    // Reset all states
    this.showDailyAverage = false;
    this.showWeeklyAverage = false;
    this.showMonthlyAverage = false;
  
    // Set the next state
    const key = `show${states[nextIndex]}Average` as 'showDailyAverage' | 'showWeeklyAverage' | 'showMonthlyAverage';
    this[key] = true;
  
    // Show a snackbar message
    openSnackbar(this._snackBar, `Showing ${states[nextIndex]} Average`);
  }
}
