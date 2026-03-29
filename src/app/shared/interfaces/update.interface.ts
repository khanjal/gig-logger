/**
 * Update detail interface for application update information.
 */
export interface IUpdateDetail {
  title: string;
  changes?: string[];
  pagesAffected?: string[];
}

/**
 * Update entry interface for grouping updates by date.
 */
export interface IUpdateEntry {
  date: string;
  dateLabel: string;
  isWeekly?: boolean;
  updates: IUpdateDetail[];
}
