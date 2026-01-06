import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UpdateEntry {
  date: string;
  dateLabel: string;
  isWeekly?: boolean;
  updates: UpdateDetail[];
}

export interface UpdateDetail {
  title: string;
  description?: string;
  filesChanged?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UpdatesService {
  private readonly updates: UpdateEntry[] = [
    {
      date: '2026-01-02',
      dateLabel: 'January 2, 2026',
      updates: [
        {
          title: 'Issues & Refactoring',
          description: 'General code cleanup, bug fixes, and refactoring for improved maintainability'
        }
      ]
    },
    {
      date: '2025-12-27',
      dateLabel: 'December 27, 2025',
      updates: [
        {
          title: 'Test Updates',
          description: 'Improved test coverage and fixed test-related issues'
        }
      ]
    },
    {
      date: '2025-11-27',
      dateLabel: 'November 27, 2025',
      updates: [
        {
          title: 'Added Search with Voice Support',
          description: 'Users can now search trips and shifts with optional voice input for hands-free operation while working',
          filesChanged: ['src/app/pages/search/']
        },
        {
          title: 'Moved Diagnostics to Dedicated Page',
          description: 'Diagnostics now has its own full page for better visibility and management of data issues',
          filesChanged: ['src/app/pages/diagnostics/']
        }
      ]
    },
    {
      date: '2025-10-25-11-01',
      dateLabel: 'October 25 - November 1, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'Updated Privacy Policy & Expenses',
          description: 'Enhanced privacy policy documentation and expanded expense tracking capabilities',
          filesChanged: ['src/app/pages/policy/', 'src/app/pages/expenses/']
        },
        {
          title: 'Setup Page Styling',
          description: 'Improved visual organization and mobile responsiveness for initial setup',
          filesChanged: ['src/app/pages/setup/setup.component.scss']
        },
        {
          title: 'Demo Spreadsheet Support',
          description: 'Users can now try the app with a demo spreadsheet without setup',
          filesChanged: ['src/app/pages/setup/setup.component.ts']
        }
      ]
    },
    {
      date: '2025-10-06',
      dateLabel: 'October 6, 2025',
      updates: [
        {
          title: 'UI Table Improvements',
          description: 'Enhanced table styling, sorting, filtering, and responsive layout for better data visualization',
          filesChanged: ['src/app/shared/components/trips-table/', 'src/app/shared/components/']
        }
      ]
    },
    {
      date: '2025-07-01-07-05',
      dateLabel: 'July 1 - 5, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'Rate Limiting & API Updates',
          description: 'Added rate limiting to prevent API throttling, improved call efficiency',
          filesChanged: ['src/app/shared/services/api.service.ts']
        },
        {
          title: 'Mobile & Desktop Layout Improvements',
          description: 'Better responsive design for trips and shift pages across all screen sizes',
          filesChanged: ['src/app/pages/trips/', 'src/app/pages/shifts/']
        },
        {
          title: 'UI Adjustments',
          description: 'Various styling and spacing refinements',
          filesChanged: ['src/app/shared/styles/']
        }
      ]
    },
    {
      date: '2025-06-08-06-22',
      dateLabel: 'June 8 - 22, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'Major UI Rework',
          description: 'Complete redesign for better usability and visual consistency. Improved color system and component styling',
          filesChanged: ['src/styles.scss', 'src/app/shared/styles/color-vars.scss']
        },
        {
          title: 'S3 Integration for Large Sheets',
          description: 'Implemented S3 for efficient downloading of large spreadsheets'
        },
        {
          title: 'Angular Configuration Updates',
          description: 'Optimized angular.json for better build performance'
        }
      ]
    },
    {
      date: '2025-06-03',
      dateLabel: 'June 3, 2025',
      updates: [
        {
          title: 'Google OAuth2 Implementation',
          description: 'Switched from API keys to OAuth2 tokens for better security. Users now authenticate with Google accounts',
          filesChanged: ['src/app/shared/services/auth-google.service.ts', 'src/app/shared/services/auth.service.ts']
        }
      ]
    },
    {
      date: '2025-05-10',
      dateLabel: 'May 10, 2025',
      updates: [
        {
          title: 'All Standalone Components',
          description: 'Removed traditional NgModules. Entire project now uses Angular standalone components for simpler architecture',
          filesChanged: ['src/app/', 'src/app/pages/', 'src/app/shared/']
        }
      ]
    },
    {
      date: '2025-05-03-05-29',
      dateLabel: 'May 3 - 29, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'Google Maps Place Search',
          description: 'Users can search for places and addresses directly from Google Maps with autocomplete',
          filesChanged: ['src/app/shared/components/google-address/']
        },
        {
          title: 'API Rate Limiter',
          description: 'Implemented rate limiting to prevent Google API quota issues'
        }
      ]
    },
    {
      date: '2024-12-31',
      dateLabel: 'December 31, 2024',
      updates: [
        {
          title: 'Package Updates & Refactoring',
          description: 'Updated all npm dependencies to latest versions and refactored code for maintainability',
          filesChanged: ['package.json', 'package-lock.json']
        }
      ]
    },
    {
      date: '2024-09-08-09-15',
      dateLabel: 'September 8 - 15, 2024',
      isWeekly: true,
      updates: [
        {
          title: 'New AWS Lambda Backend',
          description: 'Created new C# Lambda service backend with AWS Amplify. Replaces Node.js backend with better performance',
          filesChanged: ['amplify/backend/function/GigRaptorService/']
        },
        {
          title: 'Multi-Sheet Support',
          description: 'Users can now work with multiple Google Sheets simultaneously in a single app instance',
          filesChanged: ['src/app/shared/services/api.service.ts']
        },
        {
          title: 'Create Sheets in App',
          description: 'Added ability to create new Google Sheets directly from the application'
        }
      ]
    },
    {
      date: '2024-02-19-02-27',
      dateLabel: 'February 19 - 27, 2024',
      isWeekly: true,
      updates: [
        {
          title: 'Address Input Component',
          description: 'Created reusable address-input component with Google Places API integration',
          filesChanged: ['src/app/shared/inputs/address-input/']
        },
        {
          title: 'Generic Search Input',
          description: 'Built generalized search-input for places, names, regions, and service types',
          filesChanged: ['src/app/shared/inputs/search-input/']
        }
      ]
    },
    {
      date: '2023-12-29',
      dateLabel: 'December 29, 2023',
      updates: [
        {
          title: 'Angular 17 Upgrade',
          description: 'Upgraded entire project to Angular 17 and Angular Material 17 with improved performance',
          filesChanged: ['package.json', 'tsconfig.json', 'angular.json']
        }
      ]
    },
    {
      date: '2023-11-27',
      dateLabel: 'November 27, 2023',
      updates: [
        {
          title: 'Stats & Metrics Pages',
          description: 'Added comprehensive statistics and metrics tracking with daily/weekly/monthly/yearly views',
          filesChanged: ['src/app/pages/stats/', 'src/app/pages/metrics/']
        }
      ]
    },
    {
      date: '2023-09-03',
      dateLabel: 'September 3, 2023',
      updates: [
        {
          title: 'Region Tracking',
          description: 'Added region property to trips and shifts for better organization and filtering',
          filesChanged: ['src/app/shared/models/trip.model.ts', 'src/app/shared/models/shift.model.ts']
        },
        {
          title: 'Centralized Calculations',
          description: 'Moved shift and daily total calculations to GigLoggerService for DRY principle',
          filesChanged: ['src/app/shared/services/gig-logger.service.ts']
        }
      ]
    },
    {
      date: '2023-08-17-08-20',
      dateLabel: 'August 17 - 20, 2023',
      isWeekly: true,
      updates: [
        {
          title: 'Region Dropdown in Forms',
          description: 'Made region a selectable dropdown field in trip form populated from current shifts',
          filesChanged: ['src/app/pages/quick/quick-form.component.ts', 'src/app/pages/quick/quick-form.component.html']
        }
      ]
    },
    {
      date: '2023-08-11-08-14',
      dateLabel: 'August 11 - 14, 2023',
      isWeekly: true,
      updates: [
        {
          title: 'Automated Sheet Generation',
          description: 'Built backend system that auto-generates formatted Google Sheets with formulas, data validation, and protection',
          filesChanged: ['amplify/backend/function/GigRaptorService/src/Helpers/SheetHelper.cs']
        },
        {
          title: 'Daily/Weekly/Monthly/Yearly Sheets',
          description: 'Auto-generated analytical sheets with array formulas, conditional formatting, and protected ranges',
          filesChanged: ['amplify/backend/function/GigRaptorService/src/']
        }
      ]
    },
    {
      date: '2023-05-25',
      dateLabel: 'May 25, 2023',
      updates: [
        {
          title: 'AWS Amplify Backend',
          description: 'Added serverless backend using AWS Amplify with API Gateway and Lambda functions',
          filesChanged: ['amplify/', 'src/environments/']
        }
      ]
    },
    {
      date: '2023-03-23',
      dateLabel: 'March 23, 2023',
      updates: [
        {
          title: 'Google Sheets Bulk Save',
          description: 'Implemented batch operations for efficiently saving trips and shifts to Google Sheets',
          filesChanged: ['src/app/shared/services/googleSheet.service.ts']
        },
        {
          title: 'Truncate Pipe',
          description: 'Created custom pipe for safely truncating long text in templates',
          filesChanged: ['src/app/shared/pipes/truncate.pipe.ts']
        }
      ]
    },
    {
      date: '2023-03-13-03-14',
      dateLabel: 'March 13 - 14, 2023',
      isWeekly: true,
      updates: [
        {
          title: 'Quick Add Component',
          description: 'Core component for fast trip and shift entry - the heart of the app',
          filesChanged: ['src/app/pages/quick/']
        },
        {
          title: 'Data Models',
          description: 'Created TypeScript interfaces for Name, Address, Place, Service, Shift, and Trip entities',
          filesChanged: ['src/app/shared/models/']
        }
      ]
    },
    {
      date: '2023-03-06',
      dateLabel: 'March 6, 2023',
      updates: [
        {
          title: 'Angular 15 Upgrade',
          description: 'Upgraded to Angular 15 and Angular Material 15 for modern features and performance',
          filesChanged: ['package.json', 'tsconfig.json']
        }
      ]
    },
    {
      date: '2022-08-21',
      dateLabel: 'August 21, 2022',
      updates: [
        {
          title: 'Initial Codebase',
          description: 'Created initial Angular project with home, shifts, and header components. Project foundation laid',
          filesChanged: ['src/app/', 'src/environments/', 'package.json', 'angular.json']
        }
      ]
    }
  ];

  constructor() { }

  getUpdates(): Observable<UpdateEntry[]> {
    return new BehaviorSubject(this.updates).asObservable();
  }
}
