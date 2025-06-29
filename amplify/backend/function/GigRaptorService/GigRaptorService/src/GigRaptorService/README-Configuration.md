# Configuration Guide

## Feature Flags

### EnableRateLimiting
- **Location**: `Features:EnableRateLimiting` in appsettings.json
- **Default**: `false`
- **Description**: Controls whether API rate limiting is enforced
- **When enabled**: 
  - Google Places API calls are limited to 10 autocomplete and 20 details requests per minute per user
  - Other API endpoints have their own rate limits as defined by `[RateLimitFilter]` attributes
  - Uses in-memory caching for rate limit tracking
- **When disabled**: 
  - All API calls proceed without rate limiting
  - User identification is still extracted for logging purposes
  - No performance impact from rate limit checking

## Google Places API Configuration

### ApiKey
- **Location**: `GooglePlaces:ApiKey` in appsettings.json
- **Required**: Yes, when using Google Places functionality
- **Description**: Your Google Places API key for server-side requests
- **Security**: Keep this secret and never expose in client-side code

## AWS Configuration

### S3 Bucket
- **Location**: `AWS:S3:BucketName` in appsettings.json
- **Required**: For file storage features
- **Description**: S3 bucket name for storing application files

## Recommended Settings

### Development
```json
{
  "Features": {
    "EnableRateLimiting": false
  }
}
```

### Production
```json
{
  "Features": {
    "EnableRateLimiting": true
  }
}
```
