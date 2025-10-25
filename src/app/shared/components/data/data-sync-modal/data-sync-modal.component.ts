// Angular imports
import { Component, ElementRef, Inject, Input, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// RxJS imports
import { map, Subscription, timer } from 'rxjs';

// Application-specific imports - Helpers
import { DateHelper } from '@helpers/date.helper';
import { ApiMessageHelper } from '@helpers/api-message.helper';

// Application-specific imports - Interfaces
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { ISheet } from '@interfaces/sheet.interface';

// Application-specific imports - Services
import { GigWorkflowService } from '@services/gig-workflow.service';
import { ShiftService } from '@services/sheets/shift.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { TimerService } from '@services/timer.service';
import { TripService } from '@services/sheets/trip.service';
import { NgFor, NgClass } from '@angular/common';
import { MatFabButton } from '@angular/material/button';

// Define types for better type safety
type SyncType = 'save' | 'load';
type MessageType = 'info' | 'warning' | 'error';

interface TerminalMessage {
  time: string;
  text: string;
  type: MessageType;
}

interface SyncState {
  isPaused: boolean;
  isAutoClose: boolean;
  canContinue: boolean;
  forceLoad: boolean;
  hasNonInfoMessage: boolean;
}

@Component({
    selector: 'app-data-sync-modal',
    templateUrl: './data-sync-modal.component.html',
    styleUrls: ['./data-sync-modal.component.scss'],
    standalone: true,
    imports: [NgFor, NgClass, MatFabButton]
})
export class DataSyncModalComponent implements OnInit, OnDestroy {
    @ViewChild('terminal', { static: false }) terminalElement!: ElementRef;
    
    // Timer related properties
    private timerSubscription: Subscription | null = null;
    private readonly timerDelay = 5000;
    currentTime = 0;
    time = 0;
    currentTimeString = "";

    // Sync state management
    protected syncState: SyncState = {
        isPaused: false,
        isAutoClose: true,
        canContinue: false,
        forceLoad: false,
        hasNonInfoMessage: false
    };

    // Terminal messages
    private messages: TerminalMessage[] = [];
    
    // Data management
    protected data: ISheet | null = null;
    protected defaultSheet!: ISpreadsheet;
    
    get terminalMessages(): TerminalMessage[] {
        return this.messages;
    }
    
    constructor(
        @Inject(MAT_DIALOG_DATA) public type: SyncType,
        public dialogRef: MatDialogRef<DataSyncModalComponent>,
        private _gigLoggerService: GigWorkflowService,
        private _sheetService: SpreadsheetService,
        private _shiftService: ShiftService,
        private _tripService: TripService,
        private _timerService: TimerService
    ) { }

    async ngOnInit(): Promise<void> {
        this.defaultSheet = await this._sheetService.getDefaultSheet();
        await this.warmup(0);

        switch (this.type) {
            case 'save':
                await this.saveData();
                break;
            case 'load':
                await this.getData();
                break;
            default:
                this.appendToTerminal(`Invalid type: ${this.type}`, 'error');
                break;
        }
        
        await this.completeSync();
    }

    async warmup(startFrom: number = 0) {
        this.startTimer(startFrom);
        this.appendToTerminal("Checking service status...");
        
        let response = await this._sheetService.warmUpLambda();
        if (!response) {
            this.processFailure("OFFLINE");
            return;
        }

        this.appendToLastMessage(`ONLINE (${this.currentTime - this.time}s)`);
        this.time = this.currentTime;
    }

    async saveData() {
        let sheetData = {} as ISheet;
        sheetData.properties = {id: this.defaultSheet.id, name: ""};
        sheetData.shifts = await this._shiftService.getUnsavedShifts();
        sheetData.trips = await this._tripService.getUnsaved();

        this.appendToTerminal("Saving changes...");
        let messages = await this._gigLoggerService.saveSheetData(sheetData);
        
        // Process the response using the helper
        const result = ApiMessageHelper.processSheetSaveResponse(messages);
        
        // Display only SAVE_DATA messages
        result.filteredMessages.forEach((msg: any) => {
            const messageLevel = msg.level === 'ERROR' ? 'error' : 
                               msg.level === 'WARNING' ? 'warning' : 'info';
            this.appendToTerminal(msg.message, messageLevel);
        });
        
        // Check if save failed
        if (!result.success) {
            this.processFailure("ERROR");
            return;
        }

        // Mark all items as saved in local database after successful save
        await this._tripService.saveUnsaved();
        await this._shiftService.saveUnsavedShifts();

        this.appendToLastMessage(`SAVED (${this.currentTime - this.time}s)`);
    }

    private async getData() {
        this.appendToTerminal("Getting sheet data...");
        let data = await this._sheetService.getSpreadsheetData(this.defaultSheet);

        if (!data) {
            this.processFailure("ERROR");
            return;
        }
        this.appendToLastMessage(`DONE (${this.currentTime - this.time}s)`);

        data.messages.forEach(message => {
            let messageLevel = message.level.toLowerCase() as MessageType;
            if (messageLevel !== 'info') {
                this.syncState.hasNonInfoMessage = true;
            }
            this.appendToTerminal(message.message, messageLevel);
        });

        await this.loadData(data);

        let secondarySpreadsheets = (await this._sheetService.getSpreadsheets())
            .filter(x => x.default !== "true");
        
        for (const secondarySpreadsheet of secondarySpreadsheets) {
            this.time = this.currentTime;
            this.appendToTerminal("Appending sheet data...");
            let data = await this._sheetService.getSpreadsheetData(secondarySpreadsheet);
            
            if (!data) {
                this.processFailure("ERROR");
                return;
            }
            
            await this._sheetService.appendSpreadsheetData(data);
            this.appendToLastMessage(`APPENDED (${this.currentTime - this.time}s)`);
        }

        if (this.syncState.hasNonInfoMessage) {
            this.syncState.isAutoClose = false;
            this.appendToTerminal("Auto-close disabled");
        }
    }

    private async loadData(data: ISheet) {
        this.time = this.currentTime;
        this.appendToTerminal("Loading sheet data...");

        if (!this.syncState.forceLoad && 
            data.messages.filter(x => x.level.toLowerCase() === 'error').length > 0) {
            this.syncState.canContinue = true;
            this.data = data;
            this.processFailure("ERROR");
            return;
        }

        await this._sheetService.loadSpreadsheetData(data);
        this.appendToLastMessage(`LOADED (${this.currentTime - this.time}s)`);
    }

    private appendToTerminal(text: string, type: MessageType = 'info') {
        this.messages.push({
            time: DateHelper.getMinutesAndSeconds(this.currentTime),
            text: text,
            type: type
        });
        this.scrollToBottom();
    }

    private appendToLastMessage(text: string) {
        if (this.messages.length > 0) {
            this.messages[this.messages.length - 1].text += ` ${text}`;
        }
    }

    private updateLastMessageType(type: MessageType) {
        if (this.messages.length > 0) {
            this.messages[this.messages.length - 1].type = type;
        }
    }

    private updateLastMessageTime() {
        if (this.messages.length > 0) {
            this.messages[this.messages.length - 1].time = 
                DateHelper.getMinutesAndSeconds(this.currentTime);
        }
    }

    private async processFailure(message: string) {
        this.syncState.isAutoClose = false;
        this.appendToLastMessage(`${message} (${this.currentTime - this.time}s)`);
        this.updateLastMessageType('error');
        
        if (this.syncState.canContinue) {              
            this.appendToTerminal("Partial data retrieved - Choose an option:", 'warning');
            this.appendToTerminal("• Continue with partial data", 'info');
            this.appendToTerminal("• Retry download", 'info');
            this.appendToTerminal("• Close", 'info');
            this.stopTimer();
        } else {
            this.appendToTerminal('Auto-close disabled');
            this.stopTimer();
        }
    }

    cancelSync() {
        this.dialogRef.close(false);
    }

    async continueLoad() {
        if (!this.data) {
            this.appendToTerminal("No data to continue with", 'error');
            return;
        }

        this.syncState.forceLoad = true;
        this.syncState.isAutoClose = true;
        this.syncState.canContinue = false;
        this.startTimer(this.currentTime);
        await this.loadData(this.data);
        await this.completeSync();
    }

    async retryLoad() {
        await this.warmup(this.currentTime);
        await this.getData();
    }

    private async completeSync() {
        if (this.syncState.isAutoClose) {
            this.appendToTerminal(`Modal closing @ ${this.currentTime + (this.timerDelay / 1000)}s`);
            await this._timerService.delay(this.timerDelay);
            this.dialogRef.close(true);
        } else {
            this.stopTimer();
        }
    }

    private startTimer(startFrom: number = 0) {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
            this.timerSubscription = null;
        }

        this.timerSubscription = timer(0, 1000)
            .pipe(
                map((x: number) => x + startFrom)
            )
            .subscribe(t => {
                this.currentTime = t;
                this.currentTimeString = DateHelper.getMinutesAndSeconds(t);
                this.updateLastMessageTime();
            });

        this.time = this.currentTime;
    }

    private stopTimer() {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
            this.timerSubscription = null;
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
            if (this.terminalElement && this.terminalElement.nativeElement) {
                this.terminalElement.nativeElement.scrollTop = this.terminalElement.nativeElement.scrollHeight;
            }
        }, 0);
    }

    ngOnDestroy(): void {
        // Clean up timer subscription to prevent memory leaks
        this.stopTimer();
    }
}
