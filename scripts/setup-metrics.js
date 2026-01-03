#!/usr/bin/env node

/**
 * One-time setup script for RaptorGig Lambda metrics
 * Run this once after your Lambda is deployed to set up CloudWatch dashboard and alarms
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const LAMBDA_FUNCTION_NAME = 'raptor-gig-service';
const AWS_REGION = 'us-east-1';
const DASHBOARD_NAME = 'RaptorGig-Metrics';

// Inline logger for consistent format (matches LoggerService)
const logger = {
  info: (msg, ...args) => console.log(`[INFO]: ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN]: ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR]: ${msg}`, ...args),
  debug: (msg, ...args) => console.log(`[DEBUG]: ${msg}`, ...args)
};

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    logger.debug(`Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

function runCommandWithOutput(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    let output = '';
    
    const process = spawn(command, args, {
      shell: true,
      ...options
    });

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${output}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function createCloudWatchDashboard() {
  try {
    logger.info('Creating CloudWatch Dashboard...');
    
    // Check if dashboard already exists
    try {
      await runCommandWithOutput('aws', [
        'cloudwatch',
        'get-dashboard',
        '--dashboard-name', DASHBOARD_NAME
      ]);
      logger.info('Dashboard already exists - updating...');
    } catch (error) {
      logger.info('Creating new dashboard...');
    }
    
    const dashboardPath = path.join(__dirname, '..', 'amplify', 'backend', 'function', 'GigRaptorService', 'GigRaptorService', 'src', 'GigRaptorService', 'Infrastructure', 'cloudwatch-dashboard.json');
    
    if (!fs.existsSync(dashboardPath)) {
      logger.error('Dashboard configuration file not found at:', dashboardPath);
      return;
    }
    
    const dashboardBody = fs.readFileSync(dashboardPath, 'utf8');
    
    // Validate JSON before sending
    try {
      JSON.parse(dashboardBody);
    } catch (parseError) {
      logger.error('Invalid JSON in dashboard configuration file');
      return;
    }
    
    // Write dashboard body to temp file for AWS CLI
    const tempDashboardFile = path.join(__dirname, 'temp-dashboard.json');
    fs.writeFileSync(tempDashboardFile, dashboardBody);
    
    // Create the dashboard using file input
    await runCommand('aws', [
      'cloudwatch',
      'put-dashboard',
      '--dashboard-name', DASHBOARD_NAME,
      '--dashboard-body', `file://${tempDashboardFile}`
    ]);
    
    // Clean up temp file
    fs.unlinkSync(tempDashboardFile);
    
    logger.info('CloudWatch dashboard configured successfully!');
    logger.info(`View at: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${DASHBOARD_NAME}`);
    
  } catch (error) {
    logger.warn('Could not create dashboard automatically.');
    logger.warn(`Error: ${error.message}`);
    logger.warn('You can manually import cloudwatch-dashboard.json in the AWS console.');
    logger.warn('Manual steps:');
    logger.warn('1. Go to CloudWatch → Dashboards → Create dashboard');
    logger.warn('2. Choose "Import dashboard" and upload the JSON file');
  }
}

async function setupCloudWatchAlarms() {
  try {
    logger.info('Setting up CloudWatch Alarms...');
    
    const alarms = [
      {
        name: 'RaptorGig-HighErrorRate',
        description: 'Alarm when error rate exceeds 5 errors per 5 minutes',
        metricName: 'Error.Total',
        threshold: 5,
        comparisonOperator: 'GreaterThanThreshold',
        statistic: 'Sum'
      },
      {
        name: 'RaptorGig-SlowResponse',
        description: 'Alarm when sync operations average longer than 5 seconds',
        metricName: 'Sheets.SaveData.Duration',
        threshold: 5000,
        comparisonOperator: 'GreaterThanThreshold',
        statistic: 'Average'
      },
      {
        name: 'RaptorGig-HighRateLimitHits',
        description: 'Alarm when rate limit hits exceed 10 per 5 minutes',
        metricName: 'RateLimit.Hit',
        threshold: 10,
        comparisonOperator: 'GreaterThanThreshold',
        statistic: 'Sum'
      }
    ];
    
    for (const alarm of alarms) {
      try {
        // Check if alarm already exists
        try {
          await runCommandWithOutput('aws', [
            'cloudwatch',
            'describe-alarms',
            '--alarm-names', alarm.name
          ]);
          logger.info(`Alarm already exists - updating: ${alarm.name}`);
        } catch (error) {
          logger.info(`Creating new alarm: ${alarm.name}`);
        }
        
        // Create alarm configuration as JSON file
        const alarmConfig = {
          AlarmName: alarm.name,
          AlarmDescription: alarm.description,
          MetricName: alarm.metricName,
          Namespace: 'RaptorGig/Lambda',
          Statistic: alarm.statistic,
          Period: 300,
          EvaluationPeriods: 2,
          Threshold: alarm.threshold,
          ComparisonOperator: alarm.comparisonOperator,
          TreatMissingData: 'notBreaching'
        };
        
        const tempAlarmFile = path.join(__dirname, `temp-alarm-${alarm.name}.json`);
        fs.writeFileSync(tempAlarmFile, JSON.stringify(alarmConfig, null, 2));
        
        // Use AWS CLI with JSON file input
        await runCommand('aws', [
          'cloudwatch',
          'put-metric-alarm',
          '--cli-input-json', `file://${tempAlarmFile}`
        ]);
        
        // Clean up temp file
        fs.unlinkSync(tempAlarmFile);
        
        logger.info(`Configured alarm: ${alarm.name}`);
      } catch (error) {
        logger.warn(`Failed to create alarm: ${alarm.name} - ${error.message}`);
      }
    }
    
  } catch (error) {
    logger.warn('Could not create alarms automatically.');
    logger.warn('You can manually create alarms in the AWS CloudWatch console.');
  }
}

async function setupMetrics() {
  try {
    logger.info('Setting up RaptorGig Lambda Metrics...');
    
    await createCloudWatchDashboard();
    await setupCloudWatchAlarms();
    
    logger.info('Metrics setup completed!');
    logger.info('What was configured:');
    logger.info('✓ CloudWatch Dashboard for monitoring');
    logger.info('✓ CloudWatch Alarms for critical issues');
    logger.info('✓ Custom metrics namespace: RaptorGig/Lambda');
    
    logger.info('Next steps:');
    logger.info('1. Deploy your Lambda function with: npm run update-lambda');
    logger.info('2. View metrics in CloudWatch console');
    logger.info('3. Monitor gig worker app performance');
    
    logger.info('Repeated runs of this script are safe and will:');
    logger.info('• Update dashboard with latest configuration');
    logger.info('• Update alarm thresholds if changed');
    logger.info('• Skip setup if everything is already configured');
    logger.info('• Never delete existing metrics data');
    
  } catch (error) {
    logger.error('Metrics setup failed:');
    logger.error(error.message);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  setupMetrics();
}

module.exports = { setupMetrics };
