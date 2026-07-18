/**
 * Minimal typings for the browser Web Speech Recognition API. Not part of the
 * TS DOM lib, so declared manually here to match the actual runtime shape.
 */
export interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface ISpeechRecognitionResult {
  [index: number]: ISpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

export interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: { [index: number]: ISpeechRecognitionResult; length: number };
}

export interface ISpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

export interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export interface IWindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}
