/**
 * Category type for classifying update entries.
 */
export type UpdateCategory = 'feature' | 'fix' | 'improvement' | 'upgrade' | 'maintenance';

/**
 * Update detail interface for application update information.
 */
export interface IUpdateDetail {
  title: string;
  category?: UpdateCategory;
  changes?: string[];
  pagesAffected?: string[];
}

/**
 * Update entry interface for grouping updates by date.
 */
export interface IUpdateEntry {
  date: string;
  dateLabel: string;
  isRollup?: boolean;
  updates: IUpdateDetail[];
}
