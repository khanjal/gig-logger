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
    
    // Step 2: Deploy the Lambda function
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
