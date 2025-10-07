## Local Development: Custom Domain & Hosts File Setup

To enable Google OAuth and API Gateway CORS for local development, use a custom domain that resolves to localhost.

### Hosts File Setup
Add this line to your hosts file:
```
127.0.0.1   gig-local.raptorsheets.com
```
- On Windows: `C:\Windows\System32\drivers\etc\hosts`
- You must open Notepad as Administrator to edit and save this file.

### Angular Serve Command
Run:
```
ng serve --host gig-local.raptorsheets.com --ssl
```

### Google OAuth & API Gateway
- Add `https://gig-local.raptorsheets.com:4200` as an allowed origin in Google Cloud Console and API Gateway CORS settings.
# Project Overview: Raptor Gig

> **Note for AI Assistants:** This file contains essential project context. Please read and reference this file when working on any part of the Raptor Gig project to ensure accurate, project-specific assistance.

> **Note for Developers & AI Assistants:** This overview should be kept up-to-date with any clarifying instructions, additional project information, or changes to development patterns. When encountering project-specific requirements, solutions, or patterns during development work, please add them to this file to maintain a comprehensive reference for future development work.

This project called Raptor Gig is to help gig workers log their trips and keep track of work they've done. It uses Angular with Tailwind CSS for the front end, a C# Lambda service, and a custom library called raptorsheets. The Lambda also manages authentication, Google Sheets integration, file storage, and Google's new Places API. The site is primarily optimized for mobile view but is also responsive for tablets, laptops, and desktops. The project is structured according to AWS Amplify conventions.

## Technologies Used
- **Frontend:** Angular, Tailwind CSS
- **Backend:** AWS Lambda (C#), raptorsheets library
- **Cloud Services:** AWS Amplify, Google Places API, Google Sheets

## Folder Structure
- `src/` — Angular frontend source code
  - `app/core/` — Singleton services, global guards, interceptors, app-wide configuration
  - `app/shared/` — Shared components, utilities, models, interfaces
  - `app/pages/` — Feature modules (each page/feature with its own module, components, services, models)
    - `trips/` — Trips feature module (components, services, models)
    - `shifts/` — Shifts feature module
    - `stats/` — Stats feature module
    - ...
  - `assets/` — Static assets (icons, images, JSON data files)
  - `environments/` — Environment-specific configuration
- `amplify/` — AWS Amplify backend resources
  - `backend/function/` — C# Lambda service
  - `api/` — API definitions and permissions
- `public/` — Static files and images
- `scripts/` — Automation scripts (subfolders for frontend/backend if needed)
- `docs/` — Project documentation, architecture diagrams, onboarding guides

## Development Patterns
- **Mobile-first design:** All components should be optimized for mobile with responsive breakpoints
- **Shared components:** Common UI elements are in `src/app/shared/components/`
- **Services:** Business logic and API calls are in `src/app/shared/services/`
- **Models/Interfaces:** TypeScript definitions are in `src/app/shared/models/` and `src/app/shared/interfaces/`
- **SCSS with variables:** Use the color variables defined in `color-vars` for consistent theming

## Common Development Tasks
- **Adding a new page:** Create in `src/app/pages/` and update routing in `app-routing.module.ts`
- **Shared functionality:** Add to appropriate folder in `src/app/shared/`
- **API integration:** Use services to communicate with the C# Lambda backend
- **Styling:** Follow mobile-first approach with Tailwind CSS and SCSS

## Key Features
- Log trips, shifts, earnings, tips, and bonuses
- View statistics and reports
- Manage services, regions, and places
- Responsive UI for all device sizes
- Authentication and cloud file management

## Basic Instructions
### Setup
1. Install Node.js and npm if not already installed.
2. Run `npm install` in the project root to install frontend dependencies.
3. Install Angular CLI globally: `npm install -g @angular/cli`
4. For backend, navigate to `amplify/backend/function` and run `dotnet restore` to install C# dependencies.

### Running the Project
- Start the Angular development server: `ng serve`
- Access the site at `http://localhost:4200`

### Building for Production
- Run `ng build --prod` to create a production build.

### Backend Lambda
- Publish the Lambda: `dotnet publish -c Release -o ./publish`
- To package and deploy the Lambda, you can use the cross-platform deployment script: `npm run update-lambda`
- The legacy `updatelambda.bat` is also available for Windows environments
- Alternatively, you can manually package and deploy using AWS CLI as described in the main README.

### Notes
- The project is optimized for mobile but works well on larger screens.
- AWS Amplify manages deployment and hosting.
- For Google API features, ensure credentials are set up as required.
- The app uses Angular Material components with custom styling
- PWA-ready with service worker and manifest configurations
- Uses SCSS with imported color variables for consistent theming

## Common Issues & Solutions
- **Build errors:** Ensure all dependencies are installed with `npm install`
- **Lambda deployment:** Use `npm run update-lambda` or ensure AWS CLI and .NET Lambda tools are configured correctly
- **API connection issues:** Check AWS Amplify backend configuration and authentication
- **Mobile responsive issues:** Follow mobile-first design patterns and test on actual devices

---
For more details, see the main `README.md` and AWS Amplify documentation.
