# Raptor Gig

## Status

**Frontend:**
[![Build](https://github.com/khanjal/gig-logger/actions/workflows/build.yml/badge.svg)](https://github.com/khanjal/gig-logger/actions/workflows/build.yml)
[![Lint](https://github.com/khanjal/gig-logger/actions/workflows/lint.yml/badge.svg)](https://github.com/khanjal/gig-logger/actions/workflows/lint.yml)
[![Tests](https://github.com/khanjal/gig-logger/actions/workflows/test.yml/badge.svg)](https://github.com/khanjal/gig-logger/actions/workflows/test.yml)

**Backend (Lambda):**
[![Tests](https://github.com/khanjal/gig-logger/actions/workflows/lambda-test.yml/badge.svg)](https://github.com/khanjal/gig-logger/actions/workflows/lambda-test.yml)
[![Lint](https://github.com/khanjal/gig-logger/actions/workflows/lambda-lint.yml/badge.svg)](https://github.com/khanjal/gig-logger/actions/workflows/lambda-lint.yml)

**Project:**
[![codecov](https://codecov.io/gh/khanjal/gig-logger/graph/badge.svg)](https://codecov.io/gh/khanjal/gig-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Architecture

![Architectural Diagram of Raptor Gig](RaptorGig.drawio.png?raw=true "Raptor Gig Diagram")

## Overview
Raptor Gig is a mobile-first PWA designed to help gig workers log their work efficiently. It provides a user-friendly interface for tracking trips, shifts, and earnings, along with detailed statistics and insights. Data is synced to Google Sheets via AWS Amplify and C# Lambda functions.

**Tech stack**: Angular 21, Tailwind CSS, Angular Material, Dexie.js (IndexedDB), AWS Amplify, C# Lambda, Google Sheets API

## Features
- Log trips and shifts
- Track earnings, tips, and bonuses
- View detailed statistics and reports
- Manage services, regions, and places
- Offline-first with local IndexedDB storage
- Google Sheets sync via backend Lambda
- Responsive PWA for desktop and mobile

## Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Angular CLI](https://angular.dev/tools/cli) (`npm install -g @angular/cli`)
- [.NET SDK](https://dotnet.microsoft.com/) (8.0+) — for Lambda development
- [AWS Amplify CLI](https://docs.amplify.aws/cli/) — for backend configuration

## UI

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

### Run
1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:4200
   ```

> For Google OAuth to work locally, use HTTPS: `npm run serve:ssl`

### Build
```bash
npm run build:prod   # Production build
npm run build:dev    # Development build
```

### Testing
Run frontend unit tests:
```bash
npm test
```

### PWA install screenshots
The install-preview images listed under `screenshots` in `src/manifest.json` (`src/assets/screenshots/narrow` and `wide`) are generated, not hand-captured. After a UI change, regenerate them with:
```bash
npx playwright install chromium   # first time only
npm run screenshots
```
This starts the dev server on port 4201 (or reuses one already there), loads stubbed sample data (no real sheet, backend or Google call) and writes each PNG at the exact size the manifest declares. Review the images, then commit them. The script lives in `e2e-screenshots/` and is not part of `npm run e2e`. To add a screen, add the entry to the manifest and a matching capture in `e2e-screenshots/install-screenshots.spec.ts`.

## Service (Lambda)

### Setup
1. Navigate to the Lambda project directory:
   ```bash
   cd amplify/backend/function/GigRaptorService
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

### Deploy Lambda
Use the provided script to build, package, and deploy:
```bash
npm run update-lambda
```

### Testing
Run unit tests for the Lambda project:
```bash
cd amplify/backend/function/GigRaptorService
dotnet test
```

## Deployment

The app is automatically deployed via **AWS Amplify** on pushes to the `main` and `test` branches. No manual deployment steps are required for the frontend.

For manual Lambda updates, use `npm run update-lambda` as described above.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

