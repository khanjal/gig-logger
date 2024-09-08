import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { map, timer } from 'rxjs';
import { TimerService } from '@services/timer.service';

@Component({
  selector: 'app-load-modal',
  templateUrl: './load-modal.component.html',
  styleUrls: ['./load-modal.component.scss']
})
export class LoadModalComponent {
    currentTime = 0;
    divMessages = "";

    constructor(public dialogRef: MatDialogRef<LoadModalComponent>,
        private _sheetService: SpreadsheetService,
        private _timerService: TimerService) { }

    async ngOnInit(): Promise<void> {
        let time = 0;

        this.startTimer();

        time = this.currentTime;
        this.appendToTerminal("Checking Google API Status...");
        await this._sheetService.warmUpLambda();
        this.appendToTerminal(`Status Checked In ${this.currentTime - time}s`);

        time = this.currentTime;
        this.appendToTerminal("Loading Spreadsheet Data...");
        await this._sheetService.loadSpreadsheetData();
        this.appendToTerminal(`Spreadsheet Data Loaded In ${this.currentTime - time}s`);

        this.appendToTerminal("Modal Closing In 5s");

        await this._timerService.delay(5000);
        this.dialogRef.close(true);
    }

    appendToTerminal(text: string) {
        this.divMessages = `${this.divMessages}<p>${text}</p>`
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
            .subscribe(t => this.currentTime = t);
    }
}
