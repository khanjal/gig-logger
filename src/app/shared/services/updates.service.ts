import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import type { IUpdateDetail, IUpdateEntry } from '@interfaces/update.interface';

@Injectable({
  providedIn: 'root'
})
export class UpdatesService {
  private updatesSubject = new BehaviorSubject<IUpdateEntry[]>([
    {
      date: '2026-04-17',
      dateLabel: 'April 17, 2026',
      updates: [
        {
          title: 'Smoother Saving and Faster App Flow',
          category: 'upgrade',
          changes: [
            'Trips, shifts, and expenses now refresh more smoothly while you work',
            'Reduced interruptions during save and sync actions',
            'Improved responsiveness across key pages',
            'General reliability and stability improvements'
          ],
          pagesAffected: ['Trips', 'Shifts', 'Expenses', 'Setup']
        }
      ]
    },
    {
      date: '2026-04-08',
      dateLabel: 'April 8, 2026',
      updates: [
        {
          title: 'Better Demo Setup Experience',
          category: 'feature',
          changes: [
            'Starting with a demo sheet is now smoother and more reliable',
            'Added clearer status banners when a demo sheet is connected',
            'Improved onboarding flow for first-time users'
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
          title: 'Clearer Colors Across Light and Dark Mode',
          category: 'improvement',
          changes: [
            'Improved color consistency throughout the app',
            'Made text and UI elements easier to read in both themes',
            'Reduced visual mismatches across screens',
            'Set up a stronger base for future visual polish'
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
          title: 'More Reliable Voice Entry',
          category: 'improvement',
          changes: [
            'Improved voice input stability when adding trip details',
            'Reduced edge-case failures during voice entry',
            'Added stronger quality checks to prevent regressions'
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
          title: 'Cleaner Trip Layout and Sync Messages',
          category: 'improvement',
          changes: [
            'Made trip details easier to scan and read',
            'Improved sync message formatting for better clarity',
            'Polished layout behavior on smaller screens'
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
          title: 'Improved Trips and Shifts Tables',
          category: 'improvement',
          changes: [
            'Tables are easier to read and navigate',
            'Better sorting and filtering of your data',
            'Improved table layout on mobile devices'
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
          title: 'Layout Fixes for Trips and Shifts',
          category: 'improvement',
          changes: [
            'Improved page layouts on both mobile and desktop',
            'Fixed the back-to-top button',
            'Various usability tweaks'
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
          title: 'App-Wide Visual Redesign',
          category: 'feature',
          changes: [
            'Refreshed the look and feel across all pages',
            'Faster loading for large spreadsheets',
            'Search results are more reliable on slow connections',
            'Improved display of places and names'
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
          title: 'Sign In with Google',
          category: 'feature',
          changes: [
            'You can now sign in using your Google account',
            'Spreadsheet access is handled securely via Google sign-in',
            'Streamlined authentication flow during setup'
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
          title: 'Under-the-Hood Performance Improvements',
          category: 'upgrade',
          changes: [
            'Rebuilt app internals for faster load times',
            'Reduced memory usage across all pages',
            'Improved stability on low-end devices'
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
          title: 'Faster and More Stable Data Loading',
          category: 'maintenance',
          changes: [
            'Reduced errors from too many data requests at once',
            'Improved overall data loading performance'
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
          title: 'Real-Time Sync and Address Search Improvements',
          category: 'feature',
          changes: [
            'App now stays in sync without needing a manual refresh',
            'Saved data loads more consistently',
            'Address suggestions are more accurate and responsive',
            'Various UI fixes and polish'
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
          title: 'Stability and Performance Housekeeping',
          category: 'maintenance',
          changes: [
            'Updated internal libraries for security and performance',
            'General cleanup to keep the app running smoothly'
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
          title: 'Support for Multiple Spreadsheets',
          category: 'feature',
          changes: [
            'You can now create and switch between multiple spreadsheets',
            'Rebuilt the data backend for better performance and reliability',
            'Improved how your spreadsheet ID is tracked between sessions'
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
          title: 'Smarter Search and Safer Deletes',
          category: 'feature',
          changes: [
            'Address search now uses Google Places autocomplete',
            'Added confirmation prompts before deleting items',
            'Improved search field styling and usability'
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
