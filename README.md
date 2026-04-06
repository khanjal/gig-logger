# Raptor Gig

## Status

[![Frontend Tests](https://github.com/khanjal/gig-logger/actions/workflows/frontend-tests.yml/badge.svg)](https://github.com/khanjal/gig-logger/actions/workflows/frontend-tests.yml)
[![Lambda Tests](https://github.com/khanjal/gig-logger/actions/workflows/lambda-tests.yml/badge.svg)](https://github.com/khanjal/gig-logger/actions/workflows/lambda-tests.yml)
[![codecov](https://codecov.io/gh/khanjal/gig-logger/graph/badge.svg)](https://codecov.io/gh/khanjal/gig-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Architecture

![Architectural Diagram of Raptor Gig](RaptorGig.drawio.png?raw=true "Raptor Gig Diagram")

## Overview
Raptor Gig is a mobile-first PWA designed to help gig workers log their work efficiently. It provides a user-friendly interface for tracking trips, shifts, and earnings, along with detailed statistics and insights. Data is synced to Google Sheets via AWS Amplify and C# Lambda functions.

**Tech stack**: Angular 20, Tailwind CSS, Angular Material, Dexie.js (IndexedDB), AWS Amplify, C# Lambda, Google Sheets API

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

