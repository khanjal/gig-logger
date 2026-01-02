# Raptor Gig

[![Frontend Tests](https://github.com/khanjal/gig-logger/actions/workflows/frontend-tests.yml/badge.svg)](https://github.com/khanjal/gig-logger/actions/workflows/frontend-tests.yml)
[![Lambda Tests](https://github.com/khanjal/gig-logger/actions/workflows/lambda-tests.yml/badge.svg)](https://github.com/khanjal/gig-logger/actions/workflows/lambda-tests.yml)
[![codecov](https://codecov.io/gh/khanjal/gig-logger/graph/badge.svg)](https://codecov.io/gh/khanjal/gig-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Architectual Diagram of Raptor Gig](RaptorGig.drawio.png?raw=true "Raptor Gig Diagram")

## Overview
Raptor Gig is a tool designed to help gig workers log their work efficiently. It provides a user-friendly interface for tracking trips, shifts, and earnings, along with detailed statistics and insights.

## Features
- Log trips and shifts
- Track earnings, tips, and bonuses
- View detailed statistics and reports
- Manage services, regions, and places
- Responsive UI for desktop and mobile

## UI

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure Angular CLI is installed globally:
   ```bash
   npm install -g @angular/cli
   ```

### Run
1. Start the development server:
   ```bash
   ng serve
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:4200
   ```

### Build
To create a production build:
```bash
ng build --prod
```

## Service

### Setup
1. Navigate to the Lambda project directory:
   ```bash
   cd amplify/backend/function
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

### Update Lambda
1. Publish the Lambda project:
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. Package the Lambda function:
   ```bash
   cd publish
   zip -r function.zip .
   ```

3. Deploy the updated Lambda function using the AWS CLI:
   ```bash
   aws lambda update-function-code --function-name <function-name> --zip-file fileb://function.zip
   ```

### Testing
Run unit tests for the Lambda project:
```bash
cd service

dotnet test
```

## Deployment

### Frontend
1. Build the Angular app for production:
   ```bash
   ng build --prod
   ```
2. Deploy the `dist` folder to your hosting provider (e.g., AWS S3, Firebase Hosting).

### Backend
1. Publish the Lambda project:
   ```bash
   dotnet publish -c Release -o ./publish
   ```
2. Package the Lambda function:
   ```bash
   cd publish
   zip -r function.zip .
   ```
3. Deploy the function using the AWS CLI as described above.

## Contributing
1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes and push the branch:
   ```bash
   git push origin feature-name
   ```
4. Open a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

