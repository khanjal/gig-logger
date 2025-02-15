import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SpreadsheetService } from '../../services/spreadsheet.service';
import { TimerService } from '../../services/timer.service';
import { ISheet } from '../../interfaces/sheet.interface';
import { ShiftService } from '../../services/shift.service';
import { TripService } from '../../services/trip.service';
import { GigLoggerService } from '../../services/gig-logger.service';
import { firstValueFrom, map, timer } from 'rxjs';
import { DateHelper } from '@helpers/date.helper';

@Component({
  selector: 'app-save-modal',
  templateUrl: './save-modal.component.html',
  styleUrls: ['./save-modal.component.scss']
})
export class SaveModalComponent {
    currentTime = 0;
    currentTimeString = "";
    currentTask = "";
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
        sheetData.shifts = await this._shiftService.getUnsavedShifts();
        sheetData.trips = await this._tripService.getUnsavedTrips();

        this.startTimer();
        time = this.currentTime;

        this.currentTask = "Checking Google API Status..."
        let warmupResponse = await this._sheetService.warmUpLambda();
        
        if (!warmupResponse) {
            this.appendToTerminal(`${this.currentTask} OFFLINE`);   
            this.currentTask = "Modal Closing In 5s";

            await this._timerService.delay(5000);
            this.dialogRef.close(false); 
        }

        this.appendToTerminal(`${this.currentTask} ONLINE`);

        this.currentTask = "Saving Trips Data...";
        
        let postResponse = await this._gigLoggerService.postSheetData(sheetData);
        console.log(postResponse);
        if (postResponse) {
            this.appendToTerminal(`${this.currentTask} SAVED (${this.currentTime - time}s)`);
        } else {
            this.appendToTerminal(`${this.currentTask} FAILED (${this.currentTime - time}s)`);
        }

        this.currentTask = "Modal Closing In 5s";

        await this._timerService.delay(5000);
        this.dialogRef.close(true);
    }

    appendToTerminal(text: string) {
        this.divMessages = `${this.divMessages}<p>${DateHelper.getMinutesAndSeconds(this.currentTime)} ${text}</p>`
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
            .subscribe(t => {
                this.currentTime = t;
                this.currentTimeString = DateHelper.getMinutesAndSeconds(t);
            });
    }
}
