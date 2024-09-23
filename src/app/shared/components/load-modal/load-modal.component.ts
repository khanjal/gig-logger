import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { map, timer } from 'rxjs';
import { TimerService } from '@services/timer.service';
import { DateHelper } from '@helpers/date.helper';

@Component({
  selector: 'app-load-modal',
  templateUrl: './load-modal.component.html',
  styleUrls: ['./load-modal.component.scss']
})
export class LoadModalComponent {
    currentTime = 0;
    currentTimeString = "";
    currentTask = "";
    divMessages = "";

    constructor(public dialogRef: MatDialogRef<LoadModalComponent>,
        private _sheetService: SpreadsheetService,
        private _timerService: TimerService) { }

    async ngOnInit(): Promise<void> {
        let time = 0;

        this.startTimer();

        this.currentTask = "Checking Google API Status..."
        await this._sheetService.warmUpLambda();
        this.appendToTerminal(`${this.currentTask} ONLINE`);

        time = this.currentTime;
        this.currentTask = "Loading Sheet Data...";
        await this._sheetService.loadSpreadsheetData();
        this.appendToTerminal(`${this.currentTask} LOADED (${this.currentTime - time}s)`);

        this.currentTask = "Modal Closing In 5s";

        await this._timerService.delay(5000);
        this.dialogRef.close(true);
    }

    appendToTerminal(text: string) {
        this.divMessages = `${this.divMessages}<p>${DateHelper.getMinutesAndSeconds(this.currentTime)} ${text}</p>`
    }

    cancelLoad() {
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
