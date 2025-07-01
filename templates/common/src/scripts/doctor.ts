#!/usr/bin/env tsx

/**
 * Health Check Script - Validates MCP server configuration and connectivity
 * 
 * This script performs comprehensive health checks to ensure your MCP server
 * is properly configured and ready for deployment to Commands.com.
 * 
 * Run with: npm run doctor
 */

import { createConnection } from 'net';
import fs from 'fs/promises';
import path from 'path';
import { verifyToken } from '../auth/verifyToken';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

const checks: HealthCheck[] = [];

async function runHealthChecks() {
  console.log('🔍 Running MCP Server Health Checks...\n');

  // Environment Variables Check
  await checkEnvironmentVariables();
  
  // Port Availability Check  
  await checkPortAvailable();
  
  // Configuration Files Check
  await checkConfigurationFiles();
  
  // JWT Configuration Check
  await checkJWTConfiguration();
  
  // Commands.com Connectivity Check
  await checkCommandsConnectivity();
  
  // Dependencies Check
  await checkDependencies();

  // Print Results
  printResults();
  
  // Exit with appropriate code
  const hasFailures = checks.some(check => check.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

async function checkEnvironmentVariables() {
  const requiredVars = [
    'COMMANDS_JWT_ISSUER',
    'COMMANDS_JWT_AUDIENCE'
  ];
  
  const optionalVars = [
    'COMMANDS_API_URL',
    'PORT',
    'NODE_ENV'
  ];

  let allPresent = true;
  const missing: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      allPresent = false;
      missing.push(varName);
    }
  }

  if (allPresent) {
    checks.push({
      name: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables are set',
      details: `Required: ${requiredVars.join(', ')}`
    });
  } else {
    checks.push({
      name: 'Environment Variables',
      status: 'fail',
      message: `Missing required environment variables: ${missing.join(', ')}`,
      details: 'Copy .env.example to .env and configure your values'
    });
  }

  // Check optional vars
  const presentOptional = optionalVars.filter(varName => process.env[varName]);
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);
  
  if (missingOptional.length > 0) {
    checks.push({
      name: 'Optional Environment Variables',
      status: 'warn',
      message: `Optional variables not set: ${missingOptional.join(', ')}`,
      details: 'These are optional but recommended for production'
    });
  }
}

async function checkPortAvailable() {
  const port = parseInt(process.env.PORT || '3000');
  
  return new Promise<void>((resolve) => {
    const server = createConnection({ port, host: 'localhost' });
    
    server.on('connect', () => {
      server.destroy();
      checks.push({
        name: 'Port Availability',
        status: 'warn',
        message: `Port ${port} is already in use`,
        details: 'Server may already be running or port is occupied'
      });
      resolve();
    });
    
    server.on('error', () => {
      checks.push({
        name: 'Port Availability',
        status: 'pass',
        message: `Port ${port} is available`,
        details: 'Server can start on this port'
      });
      resolve();
    });
  });
}

async function checkConfigurationFiles() {
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    '.env.example',
    'commands.yaml'
  ];

  const results = await Promise.allSettled(
    requiredFiles.map(async (file) => {
      const exists = await fs.access(file).then(() => true).catch(() => false);
      return { file, exists };
    })
  );

  const missing = results
    .filter((result, index) => result.status === 'fulfilled' && !result.value.exists)
    .map((_, index) => requiredFiles[index]);

  if (missing.length === 0) {
    checks.push({
      name: 'Configuration Files',
      status: 'pass',
      message: 'All required configuration files present',
      details: `Files: ${requiredFiles.join(', ')}`
    });
  } else {
    checks.push({
      name: 'Configuration Files',
      status: 'fail',
      message: `Missing configuration files: ${missing.join(', ')}`,
      details: 'These files are required for proper operation'
    });
  }
}

async function checkJWTConfiguration() {
  const issuer = process.env.COMMANDS_JWT_ISSUER;
  const audience = process.env.COMMANDS_JWT_AUDIENCE;
  
  if (!issuer || !audience) {
    checks.push({
      name: 'JWT Configuration',
      status: 'fail',
      message: 'JWT configuration incomplete',
      details: 'COMMANDS_JWT_ISSUER and COMMANDS_JWT_AUDIENCE must be set'
    });
    return;
  }

  // Validate issuer format
  if (issuer !== 'https://api.commands.com') {
    checks.push({
      name: 'JWT Configuration',
      status: 'warn',
      message: 'JWT issuer may be incorrect',
      details: `Expected: https://api.commands.com, Got: ${issuer}`
    });
    return;
  }

  // Validate audience format
  if (!audience || audience.length < 3) {
    checks.push({
      name: 'JWT Configuration',
      status: 'warn',
      message: 'JWT audience should be your server name',
      details: `Current audience: ${audience}`
    });
    return;
  }

  checks.push({
    name: 'JWT Configuration',
    status: 'pass',
    message: 'JWT configuration looks correct',
    details: `Issuer: ${issuer}, Audience: ${audience}`
  });
}

async function checkCommandsConnectivity() {
  const apiUrl = process.env.COMMANDS_API_URL || 'https://api.commands.com';
  
  try {
    // Try to fetch JWKS endpoint
    const response = await fetch(`${apiUrl}/.well-known/jwks.json`, {
      method: 'GET',
      headers: {
        'User-Agent': 'create-commands-mcp-health-check'
      }
    });

    if (response.ok) {
      const jwks = await response.json();
      if (jwks.keys && Array.isArray(jwks.keys)) {
        checks.push({
          name: 'Commands.com Connectivity',
          status: 'pass',
          message: 'Successfully connected to Commands.com API',
          details: `JWKS endpoint accessible with ${jwks.keys.length} keys`
        });
      } else {
        checks.push({
          name: 'Commands.com Connectivity',
          status: 'warn',
          message: 'Connected but JWKS format unexpected',
          details: 'May indicate API changes'
        });
      }
    } else {
      checks.push({
        name: 'Commands.com Connectivity',
        status: 'fail',
        message: `Failed to connect to Commands.com API (${response.status})`,
        details: `URL: ${apiUrl}/.well-known/jwks.json`
      });
    }
  } catch (error) {
    checks.push({
      name: 'Commands.com Connectivity',
      status: 'fail',
      message: 'Cannot reach Commands.com API',
      details: error instanceof Error ? error.message : 'Unknown network error'
    });
  }
}

async function checkDependencies() {
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const requiredDeps = ['jsonwebtoken', 'jwks-client'];
    const devDeps = ['typescript', 'tsx'];
    
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep]);
    const missingDevDeps = devDeps.filter(dep => !packageJson.devDependencies?.[dep]);
    
    if (missingDeps.length === 0 && missingDevDeps.length === 0) {
      checks.push({
        name: 'Dependencies',
        status: 'pass',
        message: 'All required dependencies present',
        details: `Runtime: ${requiredDeps.join(', ')}, Dev: ${devDeps.join(', ')}`
      });
    } else {
      const missing = [...missingDeps, ...missingDevDeps];
      checks.push({
        name: 'Dependencies',
        status: 'fail',
        message: `Missing dependencies: ${missing.join(', ')}`,
        details: 'Run npm install to install missing packages'
      });
    }
  } catch (error) {
    checks.push({
      name: 'Dependencies',
      status: 'fail',
      message: 'Cannot read package.json',
      details: 'Make sure package.json exists and is valid JSON'
    });
  }
}

function printResults() {
  console.log('📊 Health Check Results:\n');
  
  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
    const color = check.status === 'pass' ? '\x1b[32m' : check.status === 'warn' ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${icon} ${color}${check.name}${reset}: ${check.message}`);
    if (check.details) {
      console.log(`   ${check.details}\n`);
    } else {
      console.log('');
    }
  });

  const passed = checks.filter(c => c.status === 'pass').length;
  const warnings = checks.filter(c => c.status === 'warn').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  
  console.log(`📈 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed\n`);
  
  if (failed === 0 && warnings === 0) {
    console.log('🎉 All checks passed! Your MCP server is ready for deployment.');
  } else if (failed === 0) {
    console.log('⚡ Server is functional but has warnings. Consider addressing them before deployment.');
  } else {
    console.log('🚨 Server has critical issues that must be fixed before deployment.');
  }
}

// Run if called directly
if (require.main === module) {
  runHealthChecks().catch(console.error);
}