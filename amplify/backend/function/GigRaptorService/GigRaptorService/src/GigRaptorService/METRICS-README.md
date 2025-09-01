# Lambda Metrics Implementation

This implementation adds comprehensive metrics tracking to the GigRaptor Lambda service using AWS CloudWatch.

## Features Added

### 1. MetricsService
- **Location**: `Services/MetricsService.cs`
- **Purpose**: Centralized service for tracking custom metrics
- **Privacy**: User IDs are hashed using SHA256 for privacy protection

### 2. MetricsMiddleware
- **Location**: `Middlewares/MetricsMiddleware.cs`
- **Purpose**: Automatically tracks all API calls, response times, and success rates
- **Non-blocking**: Metrics are sent asynchronously to avoid impacting API performance

### 3. Controller Integration
- **SheetsController**: Tracks data sync operations, item counts, and rate limit hits
- **AuthController**: Tracks authentication success/failure and token refresh events
- **PlacesController**: Tracks Google Places API usage and quota management

## Metrics Tracked

### API Performance
- `API.{endpoint}.Duration` - Response time in milliseconds
- `API.{endpoint}.Success/Error` - Success and error counts by endpoint
- `API.TotalCalls` - Total API call volume

### Google Sheets Operations
- `Sheets.SaveData.Duration` - Time to save data to sheets
- `Sheets.SaveData.Success/Error` - Sync success rates
- `Sheets.SaveData.ItemCount` - Number of items synced per operation
- `Sheets.TotalOperations` - Total sheets operations

### User Activity (Privacy-Protected)
- `User.DataSync` - User sync events
- `User.PlacesAutocomplete` - Places search usage
- `User.TokenRefresh` - Token refresh events
- `User.TotalActivity` - Overall user activity

### Error Tracking
- `Error.Total` - Total error count
- `Error.{ErrorType}` - Specific error types (QuotaExceeded, GeneralError, etc.)
- `RateLimit.Hit` - Rate limit violations

### Authentication
- `Auth.Success/Failed` - Authentication attempt outcomes
- `Auth.TotalAttempts` - Total authentication attempts

## CloudWatch Dashboard

A pre-configured dashboard is available in `cloudwatch-dashboard.json`. To deploy:

1. Open AWS CloudWatch Console
2. Go to Dashboards → Create Dashboard
3. Import the JSON configuration from `cloudwatch-dashboard.json`
4. The dashboard includes:
   - API call statistics
   - Response time trends
   - User activity patterns
   - Error rates and types
   - Recent error logs

## Benefits for Gig Workers

### Performance Optimization
- **Sync Speed**: Monitor and optimize data sync times during peak hours
- **API Response**: Track response times to identify bottlenecks
- **Error Rates**: Quickly identify and fix issues affecting drivers

### Usage Insights
- **Peak Hours**: Understand when drivers are most active
- **Feature Usage**: See which features are most valuable to users
- **Geographic Patterns**: Analyze usage by location (via Places API)

### Reliability Monitoring
- **Success Rates**: Ensure high reliability for critical sync operations
- **Rate Limiting**: Monitor and adjust rate limits based on usage patterns
- **Error Tracking**: Proactive error detection and resolution

## Privacy Considerations

- **User ID Hashing**: All user identifiers are hashed using SHA256
- **No PII**: No personally identifiable information is sent to metrics
- **Aggregated Data**: Focus on usage patterns rather than individual behavior

## Deployment

1. **Package Dependencies**: The CloudWatch SDK is already added to the project
2. **Deploy Lambda**: Use your existing deployment process
3. **IAM Permissions**: Ensure Lambda execution role has CloudWatch permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cloudwatch:PutMetricData"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

## Monitoring Alerts

Consider setting up CloudWatch alarms for:
- High error rates (>5% of total requests)
- Slow response times (>2000ms for sync operations)
- Rate limit hits (indicates need for capacity adjustment)
- Authentication failures (potential security issues)

## Cost Considerations

- **CloudWatch Metrics**: ~$0.30 per metric per month
- **Custom Metrics**: Estimated 10-15 metrics = ~$3-5/month
- **Dashboard**: Free tier includes 3 dashboards
- **Logs**: Existing Lambda logs, no additional cost

This implementation provides comprehensive insights while maintaining privacy and performance for your gig worker PWA.
