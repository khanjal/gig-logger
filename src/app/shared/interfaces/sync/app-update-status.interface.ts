/**
 * App update status interface for tracking service worker updates.
 */
export interface IAppUpdateStatus {
  isUpdateAvailable: boolean;
  isEnabled: boolean;
  currentVersion?: string;
  latestVersion?: string;
}
