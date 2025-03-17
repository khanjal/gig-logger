import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { map, timer } from 'rxjs';
import { TimerService } from '@services/timer.service';
import { DateHelper } from '@helpers/date.helper';
import { ISheet } from '@interfaces/sheet.interface';

@Component({
  selector: 'app-load-modal',
  templateUrl: './load-modal.component.html',
  styleUrls: ['./load-modal.component.scss']
})
export class LoadModalComponent {
    currentTime = 0;
    time = 0;
    currentTimeString = "";
    currentTask = "";
    divMessages = "";
    timerDelay = 5000;

    constructor(public dialogRef: MatDialogRef<LoadModalComponent>,
        private _sheetService: SpreadsheetService,
        private _timerService: TimerService) { }

    async ngOnInit(): Promise<void> {
        let primarySpreadsheet = await this._sheetService.getDefaultSheet();

        this.startTimer();
        this.time = this.currentTime;

        this.currentTask = "Checking service status..."
        let response = await this._sheetService.warmUpLambda();

        if (!response) {
            this.processFailure("OFFLINE");
            return;
        }

        this.appendToTerminal(`${this.currentTask} ONLINE (${this.currentTime - this.time}s)`);

        // Get data
        this.time = this.currentTime;
        this.currentTask = "Getting sheet data...";
        let data = await this._sheetService.getSpreadsheetData(primarySpreadsheet);

        if (!data) {
            this.processFailure("ERROR");
            return;
        }
        this.appendToTerminal(`${this.currentTask} DONE (${this.currentTime - this.time}s)`);

        // Load data
        this.time = this.currentTime;
        this.currentTask = "Loading sheet data...";
        await this._sheetService.loadSpreadsheetData(<ISheet>data);
        this.appendToTerminal(`${this.currentTask} LOADED (${this.currentTime - this.time}s)`);

        let secondarySpreadsheets = (await this._sheetService.getSpreadsheets()).filter(x => x.default !== "true");
        for (const secondarySpreadsheet of secondarySpreadsheets) {
            this.time = this.currentTime;
            this.currentTask = "Appending sheet data...";
            let data = await this._sheetService.getSpreadsheetData(secondarySpreadsheet);
            
            await this._sheetService.appendSpreadsheetData(data);
            this.appendToTerminal(`${this.currentTask} APPENDED (${this.currentTime - this.time}s)`);
        }

        this.currentTask = `Modal closing @ ${this.currentTime + (this.timerDelay / 1000)}s`;

        await this._timerService.delay(this.timerDelay);
        this.dialogRef.close(true);
    }

    appendToTerminal(text: string) {
        this.divMessages = `${this.divMessages}<p>${DateHelper.getMinutesAndSeconds(this.currentTime)} ${text}</p>`
    }

    async processFailure(message: string) {
        this.appendToTerminal(`${this.currentTask} ${message} (${this.currentTime - this.time}s)`);   
        this.currentTask = `Modal closing ${this.currentTime + (this.timerDelay / 1000)}s`;

        await this._timerService.delay(this.timerDelay);
        this.dialogRef.close(false); 
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
