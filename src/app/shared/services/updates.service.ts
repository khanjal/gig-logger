import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import type { IUpdateDetail, IUpdateEntry } from '@interfaces/update.interface';

@Injectable({
  providedIn: 'root'
})
export class UpdatesService {
  private updatesSubject = new BehaviorSubject<IUpdateEntry[]>([
    {
      date: '2026-04-08',
      dateLabel: 'April 8, 2026',
      updates: [
        {
          title: 'Demo Sheet Sync & Banners',
          category: 'feature',
          changes: [
            'Demo sheet creation now routes through sync flow',
            'Added banners for demo-attached sheet state',
            'Improved demo onboarding experience'
          ],
          pagesAffected: ['Setup', 'Dashboard']
        }
      ]
    },
    {
      date: '2026-04-04',
      dateLabel: 'April 4, 2026',
      updates: [
        {
          title: 'Semantic Color Token System',
          category: 'improvement',
          changes: [
            'Introduced semantic CSS color tokens across the app',
            'Consistent light and dark theme color variables',
            'Replaced scattered hardcoded color values',
            'Foundation for future theme customization'
          ],
          pagesAffected: ['All Pages']
        }
      ]
    },
    {
      date: '2026-03-16',
      dateLabel: 'March 16, 2026',
      updates: [
        {
          title: 'Voice Input Refactor & CI Improvements',
          category: 'improvement',
          changes: [
            'Refactored voice input component for reliability',
            'Added split dialog component tests',
            'Tightened CI/CD pipeline checks',
            'Improved test coverage across voice features'
          ],
          pagesAffected: ['Trips']
        }
      ]
    },
    {
      date: '2026-02-05',
      dateLabel: 'February 5, 2026',
      updates: [
        {
          title: 'Trip Layout & Sync Text Improvements',
          category: 'improvement',
          changes: [
            'Better text handling and overflow in sync components',
            'Improved trip card layout and readability',
            'Various styling refinements'
          ],
          pagesAffected: ['Trips']
        }
      ]
    },
    {
      date: '2026-01-02',
      dateLabel: 'January 2, 2026',
      updates: [
        {
          title: 'Issues & Refactoring',
          category: 'maintenance',
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
          category: 'feature',
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
          category: 'feature',
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
      isRollup: true,
      updates: [
        {
          title: 'Demo Spreadsheet Support',
          category: 'feature',
          changes: [
            'Users can test with demo data',
            'No Google account required for demo',
            'Sample trips and shifts included'
          ],
          pagesAffected: ['Setup']
        },
        {
          title: 'Setup Page Styling Updates',
          category: 'improvement',
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
          category: 'improvement',
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
      isRollup: true,
      updates: [
        {
          title: 'Trip & Shift Page Layout Improvements',
          category: 'improvement',
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
      isRollup: true,
      updates: [
        {
          title: 'UI Rework & S3 Download',
          category: 'feature',
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
      isRollup: true,
      updates: [
        {
          title: 'Google Authentication',
          category: 'feature',
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
          category: 'feature',
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
          category: 'upgrade',
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
          category: 'maintenance',
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
      isRollup: true,
      updates: [
        {
          title: 'Polling & Data Updates',
          category: 'feature',
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
      date: '2024-12-31',
        dateLabel: 'December 31, 2024 - January 13, 2025',
      isRollup: true,
      updates: [
        {
          title: 'Maintenance & Package Updates',
          category: 'maintenance',
          changes: [
            'Package dependency updates',
            'Code refactoring and cleanup',
            'Performance improvements'
          ]
        }
      ]
    },
    {
      date: '2024-09-08-15',
      dateLabel: 'September 8-15, 2024',
      isRollup: true,
      updates: [
        {
          title: 'New Backend & Multi-Sheet Support',
          category: 'feature',
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
      isRollup: true,
      updates: [
        {
          title: 'Search Input Components',
          category: 'feature',
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
          category: 'upgrade',
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
      isRollup: true,
      updates: [
        {
          title: 'Loading & Saving Modals',
          category: 'feature',
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
      isRollup: true,
      updates: [
        {
          title: 'Trip Form & Google Sheets Integration',
          category: 'feature',
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
      isRollup: true,
      updates: [
        {
          title: 'Initial Project Setup',
          category: 'feature',
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

  getUpdates(): Observable<IUpdateEntry[]> {
    return this.updatesSubject.asObservable();
  }
}
