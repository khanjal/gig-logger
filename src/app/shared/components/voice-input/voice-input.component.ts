import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { DropdownDataService } from '@services/dropdown-data.service';
import { LoggerService } from '@services/logger.service';
import { PermissionService } from '@services/permission.service';
import { VoiceSuggestionService } from '@services/voice-suggestion.service';
import { VoicePatternProcessorService } from '@services/voice-pattern-processor.service';
import { IVoiceParseResult } from '@interfaces/voice-parse-result.interface';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'voice-input',
  templateUrl: './voice-input.component.html',
  styleUrls: ['./voice-input.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIcon]
})

export class VoiceInputComponent implements OnInit, OnDestroy {
  // Dropdown data (from database + canonical JSON fallback)
  serviceList: string[] = [];
  addressList: string[] = [];
  typeList: string[] = [];
  placeList: string[] = [];

  // Component state
  transcript: string = '';
  parsedResult: IVoiceParseResult | null = null;
  recognition: any = null;
  recognizing: boolean = false;
  private transcriptTimeout: any = null;
  suggestionPhrase: string = '';

  // Auto-hide delay (in milliseconds)
  private readonly TRANSCRIPT_AUTO_HIDE_DELAY = 3000;

  constructor(
    private _dropdownDataService: DropdownDataService,
    private logger: LoggerService,
    private _permissionService: PermissionService,
    private _voiceSuggestionService: VoiceSuggestionService,
    private _voicePatternProcessor: VoicePatternProcessorService
  ) {}

  async ngOnInit(): Promise<void> {
    // Load dropdown data (service handles canonical fallback)
    const data = await this._dropdownDataService.getAllDropdownData();
    this.serviceList = data.services;
    this.typeList = data.types;
    this.placeList = data.places;
    this.addressList = data.addresses;
  }

  @Output() voiceResult = new EventEmitter<IVoiceParseResult>();

  /**
   * Helper to match the first pattern and run a callback on match.
   */
  private matchFirstPattern<T>(
    patterns: RegExp[], 
    transcript: string, 
    onMatch: (match: RegExpMatchArray) => T | undefined
  ): T | undefined {
    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        const result = onMatch(match);
        if (result !== undefined) return result;
      }
    }
    return undefined;
  }

  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.transcriptTimeout) {
      clearTimeout(this.transcriptTimeout);
      this.transcriptTimeout = null;
    }
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
  }

  async onMicClick(): Promise<void> {
    if (!this.isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    // Verify microphone permission if possible; if explicitly denied, don't proceed
    const micAllowed = await this.hasMicrophonePermission();
    if (!micAllowed) {
      alert('Microphone access is denied. Please enable microphone permissions in your browser.');
      return;
    }

    if (!this.recognition) {
      this.initializeSpeechRecognition();
    }

    if (!this.recognizing) {
      this.startListening();
    } else {
      this.stopListening();
    }
  }

  // Synchronous check used by template bindings (must be synchronous)
  public isSpeechRecognitionSupported(): boolean {
    return this._permissionService.isSpeechRecognitionSupported() && 
           this._permissionService.getMicrophoneState() !== 'denied';
  }

  // Async permission check for microphone access used when attempting to start listening
  private async hasMicrophonePermission(): Promise<boolean> {
    return this._permissionService.hasMicrophonePermission();
  }

  private initializeSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    
    this.recognition.onresult = (event: any) => this.handleRecognitionResult(event);
    this.recognition.onerror = (event: any) => this.handleRecognitionError(event);
    this.recognition.onend = () => {
      this.recognizing = false;
    };
  }

  private handleRecognitionResult(event: any): void {
    const result = event.results[0][0].transcript;
    this.transcript = result;
    const parsed = this.parseTranscript(result);
    this.parsedResult = parsed;
    this.voiceResult.emit(parsed);
    this.recognizing = false;
    
    // Auto-hide transcript after delay
    this.scheduleTranscriptHide();
  }

  private handleRecognitionError(event: any): void {
    this.logger.error('VoiceInput - Speech recognition error:', event.error);
    
    const errorMessages: { [key: string]: string } = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone detected. Please check your device settings.',
      'not-allowed': 'Microphone access denied. Please enable microphone permissions.',
      'network': 'Network error. Please check your internet connection.',
    };
    
    const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
    alert(message);
    this.recognizing = false;
  }

  private startListening(): void {
    this.transcript = '';
    this.parsedResult = null;
    this.suggestionPhrase = this._voiceSuggestionService.getRandomSuggestion(
      this.serviceList,
      this.typeList,
      this.placeList
    );
    
    try {
      this.recognition.start();
      this.recognizing = true;
    } catch (error) {
      this.logger.error('VoiceInput - Failed to start recognition:', error);
      this.recognizing = false;
    }
  }

  private stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.recognizing = false;
    this.suggestionPhrase = '';
  }

  private scheduleTranscriptHide(): void {
    if (this.transcriptTimeout) {
      clearTimeout(this.transcriptTimeout);
    }
    
    this.transcriptTimeout = setTimeout(() => {
      this.transcript = '';
      this.parsedResult = null;
    }, this.TRANSCRIPT_AUTO_HIDE_DELAY);
  }

  get micButtonColor(): string {
    // Always blue when inactive, always red when active, no hover color
    return this.recognizing ? 'bg-red-600' : 'bg-blue-600';
  }

  /**
   * Gets the parsed result as an array of key-value pairs for template iteration
   */
  get parsedResultEntries(): Array<{ key: string; value: string }> {
    if (!this.parsedResult) return [];
    // Convert camelCase keys to Proper Case with spaces
    const toProperCase = (str: string) =>
      str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
    return Object.entries(this.parsedResult).map(([key, value]) => ({ key: toProperCase(key), value: value || '' }));
  }

  /**
   * Checks if parsed result has any data
   */
  get hasParsedData(): boolean {
    return this.parsedResultEntries.length > 0;
  }

  /**
   * Parses the recognized speech and returns an object with fields.
   * 
   * Pattern definitions are documented in voice-patterns.config.ts.
   * Processing is delegated to VoicePatternProcessorService which handles
   * pattern matching in priority order: combined patterns → context → individual fields
   * 
   * @param transcript The speech recognition result text
   * @returns Parsed voice input result with extracted fields
   */
  parseTranscript(transcript: string): IVoiceParseResult {
    return this._voicePatternProcessor.parseTranscript(transcript, {
      serviceList: this.serviceList,
      typeList: this.typeList,
      placeList: this.placeList,
      addressList: this.addressList
    });
  }
}
