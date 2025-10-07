# Raptor Gig - AI Development Guide

## Project Overview
Raptor Gig is a mobile-first Angular PWA for gig workers to track trips, shifts, earnings, and expenses. Backend uses AWS Amplify with C# Lambda functions for Google Sheets integration and authentication.

## Architecture & Key Concepts

### Frontend Stack
- **Angular 18** with standalone components (no traditional modules except routing)
- **Tailwind CSS** with custom SCSS variables (`src/app/shared/styles/color-vars.scss`)
- **Angular Material** for UI components (preflight disabled in tailwind.config.js)
- **Mobile-first responsive design** - always optimize for mobile first
- **PWA-ready** with service worker and offline support

### Backend Integration
- **AWS Amplify** backend with C# Lambda service (`amplify/backend/function/GigRaptorService/`)
- **Google Sheets API** integration via custom raptorsheets library
- **OAuth2/JWT authentication** with Google
- **Dexie.js** for local IndexedDB storage with `liveQuery()` reactive patterns

### Project Structure Conventions
```
src/app/
├── pages/           # Feature pages (trips, shifts, stats, etc.)
├── shared/
│   ├── components/  # Reusable UI components  
│   ├── services/    # Business logic and API services
│   ├── interfaces/  # TypeScript type definitions
│   ├── guards/      # Route guards (auth, sheet setup)
│   ├── pipes/       # Custom pipes (truncate, etc.)
│   └── styles/      # SCSS variables and shared styles
└── assets/          # Static files and JSON data
```

## Development Patterns

### Component Architecture
- All new components should be **standalone** (no NgModules)
- Use functional route guards: `canActivateAuth`, `canActivateSheet`
- Import patterns: Use path aliases like `@services/`, `@interfaces/`, `@components/`
- Example component structure follows `trips.component.ts` pattern
- **Parent-child communication**: Some components use event emitters and input properties for data flow

### Service Patterns
- **Injectable services** with `providedIn: 'root'`
- **Reactive data** using Dexie's `liveQuery()` for local storage
- **API communication** through centralized `ApiService` with typed endpoints
- **Error handling** with `LoggerService` and `MatSnackBar` for user feedback

### Authentication & Authorization
- Google OAuth2 via `AuthGoogleService` and `AuthService`
- JWT tokens stored in sessionStorage with automatic refresh on expiry
- **Mobile-first consideration**: Token refresh must handle network failures gracefully since gig workers often lose connectivity
- Route protection with `canActivateAuth` and `canActivateSheet` guards
- Protected routes require both authentication AND spreadsheet setup

### Data Flow
1. **Local-first**: Dexie IndexedDB for offline capabilities (`localDB`, `spreadsheetDB`)
2. **API sync**: `GigWorkflowService` handles data synchronization
3. **Google Sheets**: Backend Lambda integrates with Google Sheets API
   - **Batched requests**: Operations are queued and sent in polling batches
   - **Async processing**: Requests can take 30+ seconds to resolve
   - **Polling pattern**: Use `PollingService` for long-running operations
4. **Reactive UI**: Components subscribe to `liveQuery()` observables

## Key Development Commands

### Frontend Development
```bash
npm start              # Development server
ng serve --ssl         # HTTPS development (for Google OAuth)
npm run build:dev      # Development build
npm run build:prod     # Production build
```

### Backend Lambda Development
```bash
npm run update-lambda  # Cross-platform Lambda deployment script
cd amplify/backend/function/GigRaptorService && dotnet restore
```

### Testing
```bash
npm test              # Run unit tests (project needs more test coverage)
```

### Deployment
- **Auto-deployment**: Amplify automatically deploys from `main` and `test` branches
- **Manual Lambda**: Use `npm run update-lambda` for backend updates

### Environment Configuration
- **Development**: Uses `environment.ts` with dev API endpoint
- **Production**: `environment.prod.ts` with production API
- **API Base**: `gigLoggerApi` points to Lambda service endpoint

## Mobile-First Design Guidelines
- **Always start with mobile layout** then scale up with Tailwind responsive prefixes
- Use **Angular Material components** styled with custom SCSS variables
- **Color system**: Reference `color-vars.scss` for consistent theming
- **Spacing**: Use Tailwind's extended spacing scale (includes custom 0.5, 18, 88)

## Common Development Workflows

### Adding New Features
1. Create page component in `src/app/pages/[feature]/`
2. Add route to `app-routing.module.ts` with appropriate guards
3. Create interfaces in `shared/interfaces/`
4. Implement services in `shared/services/`
5. Add Dexie database tables if needed
6. **Add tests** - project currently lacks comprehensive test coverage

### API Integration
- Extend `ApiService` with new endpoints using `API_ENDPOINTS` constants
- Use `firstValueFrom()` for async operations
- Handle authentication headers via `SecureCookieStorageService`
- Log operations with `LoggerService`
- **Handle long operations**: Use `PollingService` for Google Sheets operations that may take 30+ seconds

### Styling Approach
- Use Tailwind classes for layout and spacing
- Angular Material components for interactive elements
- Custom SCSS variables for brand colors and themes
- Mobile-first breakpoints: `sm:`, `md:`, `lg:`, `xl:`

## Critical Dependencies
- **@angular/material**: UI component library
- **dexie**: IndexedDB wrapper for local storage
- **aws-amplify**: Backend integration
- **angular-oauth2-oidc**: Authentication
- **@auth0/angular-jwt**: JWT handling
- **tailwindcss**: Utility-first CSS framework

Remember: This is a mobile-first gig economy app focusing on simplicity and offline-first functionality. Always consider the user experience for drivers using this on their phones while working.
