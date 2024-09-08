import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SpreadsheetService } from '../../services/spreadsheet.service';
import { TimerService } from '../../services/timer.service';
import { ISheet } from '../../interfaces/sheet.interface';
import { ShiftService } from '../../services/shift.service';
import { TripService } from '../../services/trip.service';
import { GigLoggerService } from '../../services/gig-logger.service';
import { firstValueFrom, map, timer } from 'rxjs';

@Component({
  selector: 'app-save-modal',
  templateUrl: './save-modal.component.html',
  styleUrls: ['./save-modal.component.scss']
})
export class SaveModalComponent {
    currentTime = 0;
    divMessages = "";

    constructor(public dialogRef: MatDialogRef<SaveModalComponent>,
        private _gigLoggerService: GigLoggerService,
        private _shiftService: ShiftService,
        private _sheetService: SpreadsheetService,
        private _timerService: TimerService,
        private _tripService: TripService) { }

    async ngOnInit(): Promise<void> {
        let time = 0;
        let defaultSheet = (await this._sheetService.querySpreadsheets("default", "true"))[0];

        let sheetData = {} as ISheet;
        sheetData.properties = {id: defaultSheet.id, name: ""};
        sheetData.shifts = await this._shiftService.getUnsavedLocalShifts();
        sheetData.trips = await this._tripService.getUnsavedLocalTrips();

        this.startTimer();

        time = this.currentTime;
        this.appendToTerminal("Checking Google API Status...");
        await this._sheetService.warmUpLambda();
        this.appendToTerminal(`Status Checked In ${this.currentTime - time}s`);

        time = this.currentTime;
        this.appendToTerminal("Saving Trips Data...");
        await firstValueFrom(await this._gigLoggerService.postSheetData(sheetData));
        this.appendToTerminal(`Local Trip Data Saved In ${this.currentTime - time}s`);

        this.appendToTerminal("Modal Closing In 5s");

        await this._timerService.delay(5000);
        this.dialogRef.close(true);
    }

    appendToTerminal(text: string) {
        this.divMessages = `${this.divMessages}<p>${text}</p>`
    }

    cancelSave() {
        this.dialogRef.close(false);
    }

    startTimer() {
        timer(0, 1000)
            .pipe(
                map((x: number) => {
                    return x;
                })
            )
            .subscribe(t => this.currentTime = t);
    }
}
