# 📊 Raptor Gig Infrastructure Configuration

This directory contains AWS CloudWatch monitoring configuration for the Raptor Gig Lambda service.

## 📁 Files

### `cloudwatch-dashboard.json`
- **Purpose**: CloudWatch dashboard configuration for Raptor Gig metrics
- **Usage**: Automatically loaded by `npm run setup-metrics`
- **Contains**: Widget definitions for API performance, user activity, and Lambda metrics
- **Namespace**: `RaptorGig/Lambda`

### `cloudwatch-setup.json`
- **Purpose**: CloudFormation template for CloudWatch permissions and alarms
- **Usage**: Applied by setup scripts to configure IAM permissions
- **Contains**: IAM policies and alarm configurations
- **Note**: Currently not fully automated due to IAM permission limitations

## 🚀 Deployment

### Initial Setup (One-time)
```bash
npm run setup-metrics
```

### Lambda Updates
```bash  
npm run update-lambda
```

## 📈 Monitoring

### Dashboard URL
https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=RaptorGig-Metrics

### Key Metrics Tracked
- **API Performance**: Response times and success rates
- **User Activity**: Gig worker app usage patterns  
- **Lambda Health**: Function performance and errors
- **Google Sheets**: Sync operation monitoring

## 🔧 Maintenance

These files are:
- ✅ **Version controlled** - Changes tracked in git
- ✅ **Environment agnostic** - Works across dev/test/prod
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Mobile-first focused** - Optimized for gig worker insights

## 📝 Notes

- Dashboard automatically updates when new metrics are added
- Alarms require manual IAM permission setup (see CLOUDWATCH-PERMISSIONS-FIX.md)
- Metrics appear 1-5 minutes after API calls
- Cost: ~$0.30/month for 3 alarms (optional)
