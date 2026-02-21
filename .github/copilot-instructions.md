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

### Reusable UI Components

#### Button Components (use specific variants — NOT `app-base-button`)
We migrated away from a single generic `app-base-button` component. Always use the specialized button components instead:

- `app-base-fab` — Floating action button (circular)
- `app-base-rect` — Rectangular/standard action button
- `app-base-icon` — Minimal icon-only button (input suffixes, nav)
- `app-base-extended-fab` — FAB with label (if needed)

**Usage rules**:
- NEVER embed `<mat-icon>` inside a base button. Use the `icon` input.
- Boolean inputs must use property binding: `[fab]="true"` (if applicable).
- Use `iconColor` to set icon color (CSS value or CSS variable).
- Use `noBackground="true"` or `[noBackground]="true"` on icon-only buttons in forms/navigation.

Examples:

```html
<!-- Icon-only mini FAB (correct) -->
<app-base-fab
  fabStyle="mini"
  [noBackground]="true"
  [icon]="'clear'"
  [iconColor]="'var(--error-500)'"
  matSuffix
  (clicked)="onClear()">
</app-base-fab>

<!-- Standard rectangular action -->
<app-base-rect
  variant="primary"
  [icon]="'save'"
  (clicked)="save()">
  Save Changes
</app-base-rect>

<!-- Toggle mini FAB with dynamic variant -->
<app-base-fab
  fabStyle="mini"
  [variant]="isActive ? 'primary' : 'secondary'"
  [icon]="'drive_eta'"
  (clicked)="toggle()">
</app-base-fab>

<!-- FAB with loading state -->
<app-base-fab
  variant="primary"
  [loading]="isSaving"
  (clicked)="submit()"
  extended>
  Submit
</app-base-fab>
```

### Icon-only Rect Buttons
When you need a rectangular button that shows only an icon (no visible label), follow these rules so the icon is centered and accessibility is preserved:

- **Use the `icon` input** on the specialized component — do not project a `<mat-icon>` yourself.
- The `BaseButtonComponent` automatically detects when an icon exists and there is no projected text and will add a `btn-icon-only` host class so styles can center the icon.
- For small-screen templates where text is hidden with utility classes (e.g., `<span class="hidden sm:inline">`), add the helper class `icon-only-sm` to the `app-base-rect` element to force small-viewport centering.

Example:

```html
<app-base-rect
  class="icon-only-sm"      <!-- optional: helps small-screen centering -->
  variant="secondary"
  size="sm"
  [icon]="'file_upload'"
  title="Set Pickup Time"
  (clicked)="setPickupTime()">
  <span class="hidden sm:inline">Pickup</span>
</app-base-rect>
```

Prefer this pattern over adding long Tailwind blobs to the button — if you need a different visual, add a variant in the base button component instead of overriding styles in each template.

Available options (map to specific components as appropriate):
- `variant`: 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon'
- `size`: 'sm' | 'md' | 'lg' (rect buttons)
- `icon`: Material icon name (string)
- `iconColor`: CSS color or variable
- `iconPosition`: 'left' | 'right' (rect buttons)
- `fabStyle`: 'regular' | 'mini' (FABs)
- `extended`: boolean (FAB with label)
- `noBackground`: boolean (icon-only)
- `disabled`, `loading`, `fullWidth`

Migration note: Replace all remaining `<app-base-button>` usages with the appropriate specialized component (`app-base-fab`, `app-base-rect`, `app-base-icon`, etc.) and follow the examples above.

**Button Layout & Color Rules**
- **Single Button, Right:** Align a lone action button to the right of the row. Use a wrapper like `class="flex justify-end"` so single-row actions sit on the right edge.
- **Two Buttons, Opposite Sides:** For two actions, place them at opposite edges using `class="flex justify-between items-center"` (primary action typically on the right).
- **Three or More, Even Spacing:** Use `class="flex justify-between"` (or `gap-x-*` with `flex`) to distribute three+ buttons evenly across the row.
- **Default Color Rules:** Most buttons that perform actions should use `variant="primary"`.
- **Cancel / Close:** Use `variant="secondary"` for buttons that dismiss modals or cancel flows.
- **Undo / Remove / Dangerous Actions:** Use `variant="danger"` for destructive or undoable actions.
- **Implementation Notes:** Prefer `app-base-rect-button` with the `variant` input. Use `fullWidth` for stacked lists or narrow contexts (e.g., address lists inside accordions). Avoid making all buttons full-width by default; reserve full-width for mobile-first or list items.

### Service Patterns
- **Injectable services** with `providedIn: 'root'`
- **Reactive data** using Dexie's `liveQuery()` for local storage
- **API communication** through centralized `ApiService` with typed endpoints
- **Error handling** with `LoggerService` and `MatSnackBar` for user feedback

### Interface Organization

**Public interfaces must be in separate files in `shared/interfaces/`, not embedded in services or components.**

- **Naming convention**: Use `I` prefix for all interfaces (e.g., `ITrip`, `IVoiceParseResult`, `IShift`)
- **File location**: All public/exported interfaces go in `src/app/shared/interfaces/`
- **One interface per file**: Name the file after the interface (e.g., `voice-parse-result.interface.ts` for `IVoiceParseResult`)
- **Import using path alias**: Reference as `@interfaces/interface-name`
- **Exception**: Private implementation interfaces that are NOT exported can remain in service/component files

**Why this matters**:
- Promotes reusability across services and components
- Improves testability by allowing mock implementations
- Clear separation of concerns between data contracts and implementation
- Enables type sharing without circular dependencies

Example of **correct** interface organization:
```typescript
// ✅ CORRECT: voice-parse-result.interface.ts (separate file in shared/interfaces/)
export interface IVoiceParseResult {
  service?: string;
  type?: string;
  pay?: number;
  // ... other properties
}

// ✅ CORRECT: voice-pattern-processor.service.ts (imports from separate file)
import { IVoiceParseResult } from '@interfaces/voice-parse-result.interface';

export class VoicePatternProcessorService {
  parseTranscript(transcript: string): IVoiceParseResult {
    // ... implementation
  }
  
  // ✅ CORRECT: Private interface not exported - can stay in service file
  private interface PatternMatch {
    pattern: VoicePattern;
    match: RegExpMatchArray;
  }
}
```

Example of **incorrect** interface organization:
```typescript
// ❌ WRONG: Public interface defined in service file
export interface IVoiceParseResult {  // Should be in separate file!
  service?: string;
  // ...
}

export class VoicePatternProcessorService {
  parseTranscript(transcript: string): IVoiceParseResult {
    // ... implementation
  }
}
```

### Code Documentation Standards

**Helper Functions & Utilities**:
- Use JSDoc-style comments for all exported/public functions
- Include `@param` for each parameter with description
- Include `@returns` describing the return value
- Add `@example` for complex functions showing typical usage
- Explain edge cases (e.g., "Returns 0 for empty arrays")

Example:
```typescript
/**
 * Gets a value from an item or falls back to the first item in an array that has that property.
 * Useful for forms that need to default to the most recent non-empty value.
 * @param item The primary item to get the value from
 * @param fallbackArray Array to search if primary item doesn't have the value
 * @param propertyName The property name to retrieve
 * @returns The value or undefined
 * 
 * @example
 * const shift = shifts[0];
 * const service = getValueOrFallback(shift, shifts, 'service');
 * // Returns shift.service if truthy, otherwise finds first shift with service property
 */
export function getValueOrFallback<T>(item: T | undefined, fallbackArray: T[], propertyName: keyof T): any {
```

**Services & Components**:
- Document complex business logic with inline comments
- Explain *why* decisions were made, not just *what* the code does
- Add comments for non-obvious workarounds or browser-specific fixes

### Form Input Nullability
- **Form models allow null, domain models use numbers**: Form-specific types (e.g., `TripFormValue`) allow `null` for user inputs to represent "not provided" state. Domain models (`ITrip`, `IAmount`) use non-nullable numbers for calculations. The boundary conversion (form → domain) converts `null`/empty to `0` using `NumberHelper.toNumber()`. This keeps calculations simple while preventing unnecessary zeros in the UI.
- **Sheet serialization**: Backend/mapper logic should omit fields with value `0` when writing to Google Sheets to avoid clutter. Domain models work with `0` internally, but sheets see empty cells for unprovided values.

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
npm test                                      # Run unit tests in watch mode
npm test -- --watch=false --browsers=ChromeHeadless  # Single run with headless Chrome
npm test -- --watch=false --code-coverage --browsers=ChromeHeadless  # With coverage report
```

**Coverage Goal**: Achieve 70%+ test coverage across the codebase

### Test Development Patterns
- **Always run frontend tests from gig-logger directory**: `cd c:\Users\khanj\Projects\gig-logger; npm test`
- **Component Tests**: Use `NO_ERRORS_SCHEMA` for shallow testing, mock all injected services
- **Service Tests**: Create jasmine spy objects for dependencies, test business logic in isolation
- **Pipe Tests**: Simple input/output assertions, no TestBed needed for pure pipes
- **Guard Tests**: Mock Router and AuthService, verify navigation behavior
- **Quick Wins Strategy**: Target simple files first (pipes, helpers, basic services) to build momentum
- **Unit Test Rule**: Every new component, service, pipe, guard, or helper must ship with a matching `.spec.ts` covering happy path and edge cases.

### Test File Patterns
```typescript
// Component test setup
beforeEach(async () => {
  const serviceSpy = jasmine.createSpyObj('ServiceName', ['method1', 'method2']);
  
  await TestBed.configureTestingModule({
    imports: [ComponentName, HttpClientTestingModule],
    providers: [
      { provide: ServiceName, useValue: serviceSpy },
      { provide: MatDialogRef, useValue: dialogSpy },
      // ... other providers
    ],
    schemas: [NO_ERRORS_SCHEMA]  // Ignore unknown child components
  }).compileComponents();
});

// Mock data factory pattern
const makeEntity = (overrides: Partial<IEntity> = {}): IEntity => ({
  id: overrides.id ?? 1,
  // ... all required properties with defaults
  ...overrides
});
```

### Testing Guidelines
1. **DI Dependencies**: All injected services need mocks - common ones:
   - `HttpClient` → add `HttpClientTestingModule` to imports
   - `MatSnackBar`, `MatDialog`, `MatDialogRef` → create spy objects
   - Custom services → spy with all methods stubbed
2. **Async Operations**: Use `async/await` in tests, stub service methods to return `Promise.resolve()`
3. **Reactive Queries**: Mock Dexie `liveQuery()` to return Observable with test data
4. **Coverage Reports**: Located in `coverage/raptor-gig/index.html` after running with `--code-coverage`
5. **Common Gotchas**:
   - Missing service method in spy → Add to `createSpyObj()` array
   - "Cannot read property of undefined" → Stub the return value with `.and.returnValue()`
   - Sort errors → Ensure array is defined before calling `sort()` helper

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

## Dark/Light Theme System

### Theme Architecture
- **Theme Toggle**: Users can switch between light, dark, and system preference modes
- **CSS Variables**: Core theme colors defined in `src/styles.scss` with `:root` (light) and `html.theme-dark` (dark) blocks
- **Tailwind Dark Mode**: Uses `darkMode: 'class'` strategy with `html.theme-dark` selector
- **Theme Service**: `ThemeService` manages theme state, persistence, and system preference detection

### Color Standards & Best Practices

**REQUIRED: Always implement both light and dark mode variants for all UI elements**

#### 1. Text Colors
Use Tailwind's gray scale with proper dark mode variants:
```html
<!-- Standard text -->
<p class="text-gray-800 dark:text-gray-200">Primary content</p>
<p class="text-gray-600 dark:text-gray-300">Secondary content</p>
<p class="text-gray-500 dark:text-gray-400">Tertiary content</p>

<!-- Semantic color text -->
<span class="text-blue-700 dark:text-blue-300">Blue accent</span>
<span class="text-green-700 dark:text-green-400">Success</span>
<span class="text-red-700 dark:text-red-400">Error</span>
<span class="text-orange-700 dark:text-orange-400">Warning</span>
```

**Rule**: Light mode uses darker shades (600-800), dark mode uses lighter shades (200-400)

#### 2. Background Colors
```html
<!-- Card/surface backgrounds -->
<div class="bg-gray-50 dark:bg-gray-900">Surface</div>
<div class="bg-white dark:bg-gray-800">Container</div>

<!-- Accent backgrounds -->
<div class="bg-blue-50 dark:bg-blue-950">Info card</div>
<div class="bg-green-50 dark:bg-green-950">Success card</div>
<div class="bg-red-50 dark:bg-red-950">Error card</div>
<div class="bg-orange-50 dark:bg-orange-950">Warning card</div>

<!-- Translucent backgrounds (when opacity is needed) -->
<div class="bg-blue-100 dark:bg-blue-900/30">Badge</div>
<div class="bg-purple-100 dark:bg-purple-900/30">Tag</div>
```

**Rule**: Light mode uses -50/-100 shades, dark mode uses -950 shades or -900/opacity for translucency

#### 3. Border Colors
```html
<!-- Subtle borders -->
<div class="border border-gray-200 dark:border-gray-700">Card</div>
<div class="divide-y divide-gray-200 dark:divide-gray-700">List</div>

<!-- Accent borders -->
<div class="border-blue-200 dark:border-blue-800">Info border</div>
```

**Rule**: Light mode uses -200 shades, dark mode uses -700/-800 shades

#### 4. CSS Variables (for complex SCSS components)
When Tailwind classes are insufficient (e.g., Material components), use CSS variables:
```scss
.my-component {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
```

Available CSS variables (defined in `src/styles.scss`):
- `--color-surface`, `--color-surface-2`, `--color-surface-3`: Background layers
- `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`: Text hierarchy
- `--color-border`, `--color-border-light`: Borders and dividers
- `--color-error`, `--color-warning`, `--color-success`, `--color-info`: Semantic colors

#### 5. Semantic Utility Classes
For automatic theme-aware styling, use these semantic classes (defined in styles.scss):
```html
<p class="text-primary">Auto-themed primary text</p>
<p class="text-secondary">Auto-themed secondary text</p>
<div class="bg-surface">Auto-themed surface</div>
<div class="bg-surface-2">Auto-themed elevated surface</div>
<div class="border-soft">Auto-themed border</div>
```

### Common Mistakes to Avoid
❌ **DON'T**: Use hardcoded colors without dark variants
```html
<p class="text-gray-600">This will be too dark in dark mode</p>
<div class="bg-blue-50">This will be too light in dark mode</div>
```

✅ **DO**: Always include dark mode variants
```html
<p class="text-gray-600 dark:text-gray-300">Proper contrast in both modes</p>
<div class="bg-blue-50 dark:bg-blue-950">Proper background in both modes</div>
```

### Material Expansion Panel Dark Mode Challenge

**CRITICAL**: Angular Material expansion panels use shadow DOM encapsulation that blocks both Tailwind's `dark:` utility classes and standard CSS from penetrating into panel content.

#### The Problem
When content is inside `<mat-expansion-panel>`, Tailwind dark mode classes like `dark:text-gray-300` **will not work** even with `::ng-deep`:

```html
<!-- ❌ This WILL NOT work inside mat-expansion-panel -->
<div class="text-gray-600 dark:text-gray-300">
  This text stays dark gray in dark mode
</div>
```

#### The Solution: Extract to Child Components
Create separate standalone components for panel content and use `:host-context(html.theme-dark)` in component SCSS:

```typescript
// diagnostic-item.component.ts
@Component({
  selector: 'app-diagnostic-item',
  standalone: true,
  templateUrl: './diagnostic-item.component.html',
  styleUrl: './diagnostic-item.component.scss'
})
export class DiagnosticItemComponent {
  @Input() item: any;
  @Input() itemType: string;
}
```

```html
<!-- diagnostic-item.component.html -->
<div class="item-content">
  <span class="item-name">{{ item.name }}</span>
  <span class="item-meta">{{ item.trips }} trips</span>
</div>
```

```scss
// diagnostic-item.component.scss
.item-name {
  color: rgb(31 41 55); // text-gray-800
}

.item-meta {
  color: rgb(75 85 99); // text-gray-600
}

:host-context(html.theme-dark) {
  .item-name {
    color: rgb(229 231 235); // text-gray-200
  }

  .item-meta {
    color: rgb(209 213 219); // text-gray-300
  }
}
```

```html
<!-- Parent component using expansion panel -->
<mat-expansion-panel>
  <mat-expansion-panel-header>...</mat-expansion-panel-header>
  <div>
    <app-diagnostic-item [item]="item" [itemType]="type"></app-diagnostic-item>
  </div>
</mat-expansion-panel>
```

#### Why This Works
- Child components have their own style encapsulation that bypasses Material's shadow DOM
- `:host-context(html.theme-dark)` can detect theme changes from the parent HTML element
- SCSS with direct RGB values (not Tailwind classes) ensures styles apply correctly

#### Parent Panel SCSS Fallback
For text directly in the panel (not in child components), use aggressive `::ng-deep` selectors:

```scss
:host-context(html.theme-dark) {
  ::ng-deep .mat-expansion-panel-body {
    // Override specific Tailwind classes
    .text-gray-600,
    div.text-gray-600,
    p.text-gray-600 {
      color: rgb(229 231 235) !important; // text-gray-200
    }
  }
}
```

#### Real-World Example
The diagnostics page (`diagnostics.component.ts`) uses this pattern:
- `diagnostic-group.component` - handles grouped duplicate items
- `diagnostic-item.component` - handles individual diagnostic items
- Both use `:host-context(html.theme-dark)` with SCSS class-based styling
- Parent `diagnostics.component.scss` uses `::ng-deep` for direct panel text

**Best Practice**: When adding new content to Material expansion panels, dialogs, or bottom sheets, always create child components for complex content that needs dark mode styling.

❌ **DON'T**: Override CSS variables in component SCSS without dark mode consideration
```scss
.my-component {
  color: #333; // Hardcoded - bad!
}
```

✅ **DO**: Use CSS variables or Tailwind classes
```scss
.my-component {
  color: var(--color-text-primary); // Theme-aware - good!
}
```

### Testing Dark Mode
- **Always test visual changes in both light and dark modes**
- Use browser DevTools to toggle `html.theme-dark` class
- Check contrast ratios for accessibility (WCAG AA minimum)
- Verify readability of all text elements
- Ensure backgrounds have appropriate opacity/darkness

## Common Development Workflows

### Adding New Features
1. Create page component in `src/app/pages/[feature]/`
2. Add route to `app-routing.module.ts` with appropriate guards
3. Create interfaces in `shared/interfaces/`
4. Implement services in `shared/services/`
5. Add Dexie database tables if needed
6. **Write tests alongside implementation** - aim for 60%+ coverage on new code
7. Run tests before committing: `npm test -- --watch=false --browsers=ChromeHeadless`

### Test-Driven Development Workflow
1. **Identify target**: Pick a file with 0% coverage or low-hanging fruit
2. **Read implementation**: Understand what the code does before writing tests
3. **Set up mocks**: Create spy objects for all dependencies
4. **Write tests**: Cover happy path, edge cases, error handling
5. **Run and verify**: Ensure tests pass and check coverage increase
6. **Commit incrementally**: Don't batch too many test files in one commit

### Ongoing Test Coverage Initiative (Issue #355)
**Goal**: Systematically increase test coverage across the codebase
**Strategy**: 
- Focus on "quick wins" - simple pipes, helpers, and services first
- Add component tests for key user flows (trips, shifts, expenses)
- Target files with business logic that are currently untested
- Track progress: Update issue with coverage metrics after each batch

**Files Added (Dec 2024)**:
- Pipes: `truncate`, `duration-format`, `ordinal`, `no-seconds`, `short-address`, `order-by-date-asc`, `group-by-month`
- Guards: `auth-guard.service`
- Services: `dropdown-data.service`
- Components: `trip-form`, `trips-table-basic`

### API Integration
- Extend `ApiService` with new endpoints using `API_ENDPOINTS` constants
- Use `firstValueFrom()` for async operations
- Handle authentication headers via `SecureCookieStorageService`
- Log operations with `LoggerService`
- **Handle long operations**: Use `PollingService` for Google Sheets operations that may take 30+ seconds

### Styling Approach
- **Prefer Tailwind CSS utility classes over custom SCSS** for all styling needs
- Use Tailwind for layout, spacing, colors, typography, and responsive design
- Angular Material components for interactive UI elements
- Reserve SCSS only for truly custom needs (animations, complex selectors, vendor prefixes)
- Mobile-first breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Reference `color-vars.scss` for brand colors, but prefer Tailwind's color system
- Avoid creating new SCSS files - migrate existing ones to Tailwind utilities

### GitHub Issue Management
When a GitHub issue link (e.g., `https://github.com/khanjal/gig-logger/issues/344`) is provided:
- Use GitHub CLI (`gh`) to interact with the issue programmatically
- Common workflows:
  - Close issue after fix: `gh issue close <issue-number> --comment "Fixes: implementation details"`
  - Add comment: `gh issue comment <issue-number> --body "Comment text"`
  - Check issue status: `gh issue view <issue-number>`
- This automates issue tracking without manual GitHub website updates

### GitHub Project Board Integration
**Project**: RaptorGig Board (auto-detected by name)

When creating new GitHub issues:
1. **Automatically add to project board** using the workflow in `.github/workflows/add-to-project.yml`
2. **Move issues between columns**: `./scripts/move-project-item.ps1 -Repo "khanjal/gig-logger" -IssueNumbers 360 -ColumnName "Done"`
3. **List available columns**: `./scripts/list-project-fields.ps1 -ProjectName "RaptorGig Board"`

Available columns: New, Backlog, Ready, In progress, In review, Done

**Note**: 
- Scripts automatically find the "RaptorGig Board" project by name
- Column names support partial matching (e.g., "Done" matches "✅ Done")
- Use `-ProjectName` parameter to override default project name

## Critical Dependencies
- **@angular/material**: UI component library
- **dexie**: IndexedDB wrapper for local storage
- **aws-amplify**: Backend integration
- **angular-oauth2-oidc**: Authentication
- **@auth0/angular-jwt**: JWT handling
- **tailwindcss**: Utility-first CSS framework

Remember: This is a mobile-first gig economy app focusing on simplicity and offline-first functionality. Always consider the user experience for drivers using this on their phones while working.
