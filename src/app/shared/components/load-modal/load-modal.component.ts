// Angular imports
import { Component, ElementRef, Inject, Input, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// RxJS imports
import { map, Subscription, timer } from 'rxjs';

// Application-specific imports - Helpers
import { DateHelper } from '@helpers/date.helper';

// Application-specific imports - Interfaces
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { ISheet } from '@interfaces/sheet.interface';

// Application-specific imports - Services
import { GigLoggerService } from '@services/gig-logger.service';
import { ShiftService } from '@services/shift.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/trip.service';

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

    defaultSheet!: ISpreadsheet;

    constructor(
        @Inject(MAT_DIALOG_DATA) public type: string,
        public dialogRef: MatDialogRef<LoadModalComponent>,
        private _gigLoggerService: GigLoggerService,
        private _sheetService: SpreadsheetService,
        private _shiftService: ShiftService,
        private _tripService: TripService,
        private _timerService: TimerService) { }

    async ngOnInit(): Promise<void> {
        this.defaultSheet = await this._sheetService.getDefaultSheet();

        this.startTimer();
        this.time = this.currentTime;

        this.appendToTerminal("Checking service status...");
        let response = await this._sheetService.warmUpLambda();

        if (!response) {
            this.processFailure("OFFLINE");
            return;
        }

        this.appendToLastMessage(`ONLINE (${this.currentTime - this.time}s)`);
        this.time = this.currentTime;

        // Split between save and load
        switch (this.type) {
            case 'save':
                await this.saveData();
                break;
            case 'load':
                this.loadData();
                break;
            default:
                this.appendToTerminal(`Invalid type: ${this.type}`, "error");
                break;
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
    async saveData() {
        let sheetData = {} as ISheet;
        sheetData.properties = {id: this.defaultSheet.id, name: ""};
        sheetData.shifts = await this._shiftService.getUnsavedShifts();
        sheetData.trips = await this._tripService.getUnsavedTrips();

        this.appendToTerminal("Saving changes...");
        
        let postResponse = await this._gigLoggerService.postSheetData(sheetData);
        // console.log(postResponse);
        if (!postResponse) {
            this.processFailure("ERROR");
            return;
        }

        this.appendToLastMessage(`SAVED (${this.currentTime - this.time}s)`);
    }

    private async loadData() {
        // Get data
        this.appendToTerminal("Getting sheet data...");
        let data = await this._sheetService.getSpreadsheetData(this.defaultSheet);

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
    }

    private appendToTerminal(text: string, type: string = 'info') {
        this.divMessages.push({
            time: DateHelper.getMinutesAndSeconds(this.currentTime),
            text: text,
            type: type
        });

        this.scrollToBottom(); // Scroll to the bottom after adding a message
    }

    private appendToLastMessage(text: string) {
        this.divMessages[this.divMessages.length - 1].text += ` ${text}`;
    }

    private updateLastMessageType(type: string) {
        this.divMessages[this.divMessages.length - 1].type = type;
    }

    private updateLastMessageTime() {
        this.divMessages[this.divMessages.length - 1].time = DateHelper.getMinutesAndSeconds(this.currentTime);
    }

    private async processFailure(message: string) {
        this.appendToLastMessage(`${message} (${this.currentTime - this.time}s)`);
        this.updateLastMessageType('error');
        this.appendToTerminal('Modal autoclose disabled');
        this.stopTimer();
    }

    cancelLoad() {
        this.dialogRef.close(false);
    }

    private startTimer() {
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

    private stopTimer() {
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
