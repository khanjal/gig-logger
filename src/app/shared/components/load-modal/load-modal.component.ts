import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { map, Subscription, timer } from 'rxjs';
import { TimerService } from '@services/timer.service';
import { DateHelper } from '@helpers/date.helper';
import { ISheet } from '@interfaces/sheet.interface';

@Component({
  selector: 'app-load-modal',
  templateUrl: './load-modal.component.html',
  styleUrls: ['./load-modal.component.scss']
})
export class LoadModalComponent {
    @ViewChild('terminal') terminalElement!: ElementRef;
    
    private timerSubscription: Subscription | null = null; // Add a subscription for the timer
    
    currentTime = 0;
    time = 0;
    enableAutoClose = true;
    currentTimeString = "";
    divMessages: { time: string, text: string; type: string }[] = [];
    timerDelay = 5000;

    constructor(public dialogRef: MatDialogRef<LoadModalComponent>,
        private _sheetService: SpreadsheetService,
        private _timerService: TimerService) { }

    async ngOnInit(): Promise<void> {
        let primarySpreadsheet = await this._sheetService.getDefaultSheet();

        this.startTimer();
        this.time = this.currentTime;

        this.appendToTerminal("Checking service status...");
        let response = await this._sheetService.warmUpLambda();

        if (!response) {
            this.processFailure("OFFLINE");
            return;
        }

        this.appendToLastMessage(`ONLINE (${this.currentTime - this.time}s)`);

        // Get data
        this.time = this.currentTime;
        this.appendToTerminal("Getting sheet data...");
        let data = await this._sheetService.getSpreadsheetData(primarySpreadsheet);

        if (!data) {
            this.processFailure("ERROR");
            return;
        }
        this.appendToLastMessage(`DONE (${this.currentTime - this.time}s)`);

        data.messages.forEach(message => {
            let messageLevel = message.level.toLowerCase();
            if (messageLevel != 'info') {
                this.enableAutoClose = false;
            }

            this.appendToTerminal(message.message, messageLevel);
        });

        // Load data
        this.time = this.currentTime;
        this.appendToTerminal("Loading sheet data...");
        
        if (data.messages.filter(x => x.level.toLowerCase() == 'error').length > 0) {
            this.processFailure("ERROR");
            return;
        }

        await this._sheetService.loadSpreadsheetData(<ISheet>data);
        this.appendToLastMessage(`LOADED (${this.currentTime - this.time}s)`);

        let secondarySpreadsheets = (await this._sheetService.getSpreadsheets()).filter(x => x.default !== "true");
        for (const secondarySpreadsheet of secondarySpreadsheets) {
            this.time = this.currentTime;
            this.appendToTerminal("Appending sheet data...");
            let data = await this._sheetService.getSpreadsheetData(secondarySpreadsheet);
            
            await this._sheetService.appendSpreadsheetData(data);
            this.appendToLastMessage(`APPENDED (${this.currentTime - this.time}s)`);
        }

        if (this.enableAutoClose) {
            this.appendToTerminal(`Modal closing @ ${this.currentTime + (this.timerDelay / 1000)}s`);
            await this._timerService.delay(this.timerDelay);
            this.dialogRef.close(true);
        }
        else {
            this.appendToTerminal('Modal autoclose disabled');
            this.stopTimer();
        }
    }

    appendToTerminal(text: string, type: string = 'info') {
        this.divMessages.push({
            time: DateHelper.getMinutesAndSeconds(this.currentTime),
            text: text,
            type: type
        });

        this.scrollToBottom(); // Scroll to the bottom after adding a message
    }

    appendToLastMessage(text: string) {
        this.divMessages[this.divMessages.length - 1].text += ` ${text}`;
    }

    updateLastMessageType(type: string) {
        this.divMessages[this.divMessages.length - 1].type = type;
    }

    updateLastMessageTime() {
        this.divMessages[this.divMessages.length - 1].time = DateHelper.getMinutesAndSeconds(this.currentTime);
    }

    async processFailure(message: string) {
        this.appendToLastMessage(`${message} (${this.currentTime - this.time}s)`);
        this.updateLastMessageType('error');
        this.appendToTerminal('Modal autoclose disabled');
        this.stopTimer();
    }

    cancelLoad() {
        this.dialogRef.close(false);
    }

    startTimer() {
        this.timerSubscription = timer(0, 1000) // Emit values every second
            .pipe(
                map((x: number) => x)
            )
            .subscribe(t => {
                this.currentTime = t;
                this.currentTimeString = DateHelper.getMinutesAndSeconds(t);
                this.updateLastMessageTime();
            });
    }

    stopTimer() {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe(); // Unsubscribe from the timer
            this.timerSubscription = null; // Reset the subscription
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
          if (this.terminalElement) {
            this.terminalElement.nativeElement.scrollTop = this.terminalElement.nativeElement.scrollHeight;
          }
        }, 0);
      }
}
