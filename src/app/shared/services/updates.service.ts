import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IUpdateDetail, IUpdateEntry } from '@interfaces/update.interface';

/**
 * @deprecated Use IUpdateDetail from @interfaces/update.interface instead
 */
export type UpdateDetail = IUpdateDetail;

/**
 * @deprecated Use IUpdateEntry from @interfaces/update.interface instead
 */
export type UpdateEntry = IUpdateEntry;

@Injectable({
  providedIn: 'root'
})
export class UpdatesService {
  private updatesSubject = new BehaviorSubject<UpdateEntry[]>([
    {
      date: '2026-01-02',
      dateLabel: 'January 2, 2026',
      updates: [
        {
          title: 'Issues & Refactoring',
          changes: [
            'Code cleanup and bug fixes',
            'Performance improvements',
            'Enhanced error handling'
          ]
        }
      ]
    },
    {
      date: '2025-11-27',
      dateLabel: 'November 27, 2025',
      updates: [
        {
          title: 'Search with Voice Support',
          changes: [
            'Added voice command input for trips',
            'Improved search accuracy with fuzzy matching',
            'Moved diagnostics to dedicated page',
            'Enhanced search filters'
          ],
          pagesAffected: ['Search', 'Diagnostics']
        }
      ]
    },
    {
      date: '2025-11-01',
      dateLabel: 'November 1, 2025',
      updates: [
        {
          title: 'Privacy Policy & Expense Enhancements',
          changes: [
            'Updated privacy policy for clarity',
            'Added expense categories',
            'Improved expense tracking features'
          ],
          pagesAffected: ['Policy', 'Expenses']
        }
      ]
    },
    {
      date: '2025-10-25-26',
      dateLabel: 'October 25-26, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'Demo Spreadsheet Support',
          changes: [
            'Users can test with demo data',
            'No Google account required for demo',
            'Sample trips and shifts included'
          ],
          pagesAffected: ['Setup']
        },
        {
          title: 'Setup Page Styling Updates',
          changes: [
            'Improved setup page layout',
            'Better mobile responsiveness',
            'Enhanced visual design'
          ],
          pagesAffected: ['Setup']
        }
      ]
    },
    {
      date: '2025-10-06',
      dateLabel: 'October 6, 2025',
      updates: [
        {
          title: 'UI Table Improvements',
          changes: [
            'Enhanced table layouts',
            'Better sorting and filtering',
            'Improved mobile table views'
          ],
          pagesAffected: ['Trips', 'Shifts']
        }
      ]
    },
    {
      date: '2025-07-01-05',
      dateLabel: 'July 1-5, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'Trip & Shift Page Layout Improvements',
          changes: [
            'Better mobile and desktop layouts',
            'UI adjustments for better usability',
            'Rate limiting for API calls',
            'Fixed back-to-top button'
          ],
          pagesAffected: ['Trips', 'Shifts']
        }
      ]
    },
    {
      date: '2025-06-22-29',
      dateLabel: 'June 22-29, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'UI Rework & S3 Download',
          changes: [
            'Major UI redesign',
            'S3 download for large spreadsheets',
            'Improved search results with JSON fallback',
            'Better place/name display'
          ],
          pagesAffected: ['All Pages']
        }
      ]
    },
    {
      date: '2025-06-03-08',
      dateLabel: 'June 3-8, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'Google Authentication',
          changes: [
            'Integrated Google OAuth',
            'Token-based spreadsheet access',
            'Secure authentication flow'
          ],
          pagesAffected: ['Setup']
        }
      ]
    },
    {
      date: '2025-05-29',
      dateLabel: 'May 29, 2025',
      updates: [
        {
          title: 'Google Maps Search',
          changes: [
            'Search for places on Google Maps',
            'Search for addresses on Google Maps',
            'Direct map integration from app'
          ],
          pagesAffected: ['Trips']
        }
      ]
    },
    {
      date: '2025-05-10',
      dateLabel: 'May 10, 2025',
      updates: [
        {
          title: 'Standalone Components Migration',
          changes: [
            'Removed NgModules',
            'Converted all components to standalone',
            'Modern Angular architecture'
          ],
          pagesAffected: ['All Pages']
        }
      ]
    },
    {
      date: '2025-05-03',
      dateLabel: 'May 3, 2025',
      updates: [
        {
          title: 'Rate Limiter & Refactoring',
          changes: [
            'Added API rate limiting',
            'Code refactoring for better performance',
            'Optimized API calls'
          ]
        }
      ]
    },
    {
      date: '2025-04-08-27',
      dateLabel: 'April 8-27, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'Polling & Data Updates',
          changes: [
            'Added polling for data sync',
            'Improved saved data handling',
            'UI improvements and fixes',
            'Better Google Places API integration'
          ],
          pagesAffected: ['Trips', 'Shifts']
        }
      ]
    },
    {
      date: '2024-09-08-15',
      dateLabel: 'September 8-15, 2024',
      isWeekly: true,
      updates: [
        {
          title: 'New Backend & Multi-Sheet Support',
          changes: [
            'Created new AWS Lambda backend',
            'Refactored to support new API',
            'Support for multiple sheets',
            'Added Create Sheets functionality',
            'Sheet-Id in request headers'
          ],
          pagesAffected: ['All Pages']
        }
      ]
    },
    {
      date: '2024-02-11-27',
      dateLabel: 'February 11-27, 2024',
      isWeekly: true,
      updates: [
        {
          title: 'Search Input Components',
          changes: [
            'Created reusable search-input component',
            'Google Places autocomplete integration',
            'Added confirm dialogs for delete actions',
            'Improved input field styling'
          ],
          pagesAffected: ['Trips', 'Setup']
        }
      ]
    },
    {
      date: '2023-12-29',
      dateLabel: 'December 29, 2023',
      updates: [
        {
          title: 'Angular 17 Upgrade',
          changes: [
            'Upgraded to Angular 17',
            'Updated Material Design to v17',
            'Modernized guard functions',
            'Improved build performance'
          ],
          pagesAffected: ['All Pages']
        }
      ]
    },
    {
      date: '2023-12-11-26',
      dateLabel: 'December 11-26, 2023',
      isWeekly: true,
      updates: [
        {
          title: 'Loading & Saving Modals',
          changes: [
            'Added load modal for data sync',
            'Added save modal for feedback',
            'Cancel button for long operations',
            'Bug fixes for total calculations',
            'Calendar link improvements'
          ],
          pagesAffected: ['Trips', 'Shifts']
        }
      ]
    },
    {
      date: '2023-03-06-23',
      dateLabel: 'March 6-23, 2023',
      isWeekly: true,
      updates: [
        {
          title: 'Trip Form & Google Sheets Integration',
          changes: [
            'Created trip entry forms',
            'Google Sheets API integration',
            'Places autocomplete for addresses',
            'Quick add component',
            'Shift tracking functionality',
            'Upgraded to Angular 15'
          ],
          pagesAffected: ['Trips', 'Shifts']
        }
      ]
    },
    {
      date: '2022-08-19-21',
      dateLabel: 'August 19-21, 2022',
      isWeekly: true,
      updates: [
        {
          title: 'Initial Project Setup',
          changes: [
            'Angular app initialization',
            'Basic project structure',
            'Git repository setup',
            'Development environment configured'
          ]
        }
      ]
    }
  ]);

  getUpdates(): Observable<UpdateEntry[]> {
    return this.updatesSubject.asObservable();
  }
}
