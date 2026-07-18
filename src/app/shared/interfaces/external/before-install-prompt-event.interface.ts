/**
 * The non-standard `beforeinstallprompt` event fired by browsers that support
 * installable PWAs. Not part of the TS DOM lib, so declared manually here.
 */
export interface IBeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}
