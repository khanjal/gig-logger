#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

/**
 * Cross-platform Lambda deployment script
 * Replaces updateLambda.bat with Node.js for better cross-platform support
 */

const LAMBDA_FUNCTION_NAME = 'raptor-gig-service';
const AWS_REGION = 'us-east-1';
const LAMBDA_RUNTIME = 'dotnet8';

// Path to the Lambda project directory
const LAMBDA_PROJECT_PATH = path.join(__dirname, '..', 'amplify', 'backend', 'function', 'GigRaptorService', 'GigRaptorService', 'src', 'GigRaptorService');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
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

async function updateLambda() {
  try {
    console.log('🚀 Starting Lambda deployment...');
    console.log(`📍 Working directory: ${LAMBDA_PROJECT_PATH}`);
    
    // Step 1: Configure AWS region
    console.log('\n📡 Configuring AWS region...');
    await runCommand('aws', ['configure', 'set', 'region', AWS_REGION]);
    
    // Step 2: Check and setup CloudWatch permissions for metrics (one-time setup)
    console.log('\n📊 Checking CloudWatch permissions for metrics...');
    await setupCloudWatchPermissions();
    
    // Step 3: Deploy the Lambda function
    console.log('\n🔨 Deploying Lambda function...');
    await runCommand('dotnet', [
      'lambda', 
      'deploy-function', 
      '--function-name', LAMBDA_FUNCTION_NAME,
      '--function-runtime', LAMBDA_RUNTIME
    ], {
      cwd: LAMBDA_PROJECT_PATH
    });
    
    console.log('\n✅ Lambda deployment completed successfully!');
    console.log('\n📈 Metrics are now enabled! View them at:');
    console.log(`   https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#metricsV2:graph=~();search=GigRaptor~%2FLambda`);
    
  } catch (error) {
    console.error('\n❌ Lambda deployment failed:');
    console.error(error.message);
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('- Ensure AWS CLI is installed and configured');
    console.log('- Ensure .NET CLI and Lambda tools are installed: dotnet tool install -g Amazon.Lambda.Tools');
    console.log('- Check that you have proper AWS permissions for Lambda deployment');
    console.log('- Verify you are in the correct directory');
    
    process.exit(1);
  }
}

async function setupCloudWatchPermissions() {
  try {
    // Check if the Lambda function exists and get its role
    const getLambdaCommand = ['lambda', 'get-function', '--function-name', LAMBDA_FUNCTION_NAME, '--output', 'json'];
    
    let functionConfig;
    try {
      const result = await runCommandWithOutput('aws', getLambdaCommand);
      functionConfig = JSON.parse(result);
    } catch (error) {
      console.log('⚠️  Lambda function not found. CloudWatch permissions will be set up after deployment.');
      return;
    }
    
    // Extract role name from ARN
    const roleArn = functionConfig.Configuration.Role;
    const roleName = roleArn.split('/').pop();
    
    console.log(`   Found Lambda role: ${roleName}`);
    
    // Check if CloudWatch policy already exists
    try {
      await runCommandWithOutput('aws', ['iam', 'get-role-policy', '--role-name', roleName, '--policy-name', 'GigRaptorCloudWatchMetrics']);
      console.log('   ✓ CloudWatch permissions already configured');
      return;
    } catch (error) {
      // Policy doesn't exist, we need to create it
    }
    
    // Create CloudWatch policy
    const policyDocument = {
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
    };
    
    const tempPolicyFile = path.join(__dirname, 'temp-cloudwatch-policy.json');
    require('fs').writeFileSync(tempPolicyFile, JSON.stringify(policyDocument, null, 2));
    
    // Attach the policy
    await runCommand('aws', [
      'iam', 
      'put-role-policy', 
      '--role-name', roleName,
      '--policy-name', 'GigRaptorCloudWatchMetrics',
      '--policy-document', `file://${tempPolicyFile}`
    ]);
    
    // Clean up temp file
    require('fs').unlinkSync(tempPolicyFile);
    
    console.log('   ✓ CloudWatch permissions configured successfully!');
    
  } catch (error) {
    console.log('   ⚠️  Could not configure CloudWatch permissions automatically.');
    console.log('   📝 Please manually add cloudwatch:PutMetricData permission to your Lambda role.');
  }
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

// Check if required tools are available
async function checkPrerequisites() {
  const tools = [
    { command: 'aws', name: 'AWS CLI' },
    { command: 'dotnet', name: '.NET CLI' }
  ];
  
  for (const tool of tools) {
    try {
      await runCommand(tool.command, ['--version'], { stdio: 'pipe' });
    } catch (error) {
      console.error(`❌ ${tool.name} is not installed or not in PATH`);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking prerequisites...');
  await checkPrerequisites();
  await updateLambda();
}

if (require.main === module) {
  main();
}

module.exports = { updateLambda };
