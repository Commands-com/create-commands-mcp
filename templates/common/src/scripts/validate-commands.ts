#!/usr/bin/env tsx

/**
 * Commands.yaml Validation Script
 * 
 * Validates the commands.yaml file for Commands.com marketplace submission.
 * Checks schema compliance, required fields, and deployment readiness.
 * 
 * Run with: npm run commands:validate
 */

import fs from 'fs/promises';
import path from 'path';

interface CommandsConfig {
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    email: string;
  };
  mcp: {
    authentication: string;
    health_check?: string;
  };
  tools: Array<{
    name: string;
    description: string;
    category?: string;
  }>;
  categories: string[];
  tags?: string[];
  pricing?: string;
  rate_limits?: {
    requests_per_minute?: number;
    requests_per_hour?: number;
  };
  scopes?: string[];
  deployment?: {
    type: string;
    health_check_path?: string;
    timeout_seconds?: number;
  };
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

async function validateCommandsYaml() {
  console.log('🔍 Validating commands.yaml for Commands.com marketplace...\n');

  const errors: ValidationError[] = [];
  let config: CommandsConfig;

  try {
    // Read and parse YAML file
    const yamlContent = await fs.readFile('commands.yaml', 'utf-8');
    
    // Simple YAML parser for our needs (avoiding external deps)
    config = parseSimpleYaml(yamlContent);
    
  } catch (error) {
    console.error('❌ Failed to read commands.yaml:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }

  // Validate required fields
  validateRequired(config, errors);
  
  // Validate field formats
  validateFormats(config, errors);
  
  // Validate tools
  validateTools(config, errors);
  
  // Validate deployment configuration
  validateDeployment(config, errors);
  
  // Print results
  printValidationResults(errors);
  
  // Exit with appropriate code
  const hasErrors = errors.some(error => error.severity === 'error');
  process.exit(hasErrors ? 1 : 0);
}

function parseSimpleYaml(yamlContent: string): CommandsConfig {
  // Simple YAML parser - handles our basic structure
  // In production, you'd use a proper YAML library
  const lines = yamlContent.split('\n');
  const config: any = {};
  let currentSection: any = config;
  let currentKey = '';
  let indent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const lineIndent = line.length - line.trimStart().length;
    
    if (trimmed.includes(':')) {
      const [key, value] = trimmed.split(':', 2);
      const cleanKey = key.trim();
      const cleanValue = value?.trim().replace(/['"]/g, '') || '';

      if (lineIndent === 0) {
        // Top level key
        currentSection = config;
        if (cleanValue === '') {
          // Object
          config[cleanKey] = {};
          currentSection = config[cleanKey];
          currentKey = cleanKey;
        } else {
          // Value
          config[cleanKey] = cleanValue;
        }
      } else if (lineIndent > indent) {
        // Nested key
        if (!currentSection[currentKey]) {
          currentSection[currentKey] = {};
        }
        if (cleanValue === '') {
          currentSection[currentKey][cleanKey] = {};
        } else {
          currentSection[currentKey][cleanKey] = cleanValue;
        }
      }
      
      indent = lineIndent;
    } else if (trimmed.startsWith('-')) {
      // Array item
      const value = trimmed.slice(1).trim().replace(/['"]/g, '');
      if (!Array.isArray(currentSection[currentKey])) {
        currentSection[currentKey] = [];
      }
      currentSection[currentKey].push(value);
    }
  }

  return config as CommandsConfig;
}

function validateRequired(config: CommandsConfig, errors: ValidationError[]) {
  const requiredFields = [
    { path: 'name', type: 'string' },
    { path: 'description', type: 'string' },
    { path: 'version', type: 'string' },
    { path: 'author.name', type: 'string' },
    { path: 'author.email', type: 'string' },
    { path: 'mcp.server_url', type: 'string' },
    { path: 'mcp.authentication', type: 'string' },
    { path: 'tools', type: 'array' },
    { path: 'categories', type: 'array' }
  ];

  for (const field of requiredFields) {
    const value = getNestedValue(config, field.path);
    
    if (value === undefined || value === null || value === '') {
      errors.push({
        field: field.path,
        message: `Required field '${field.path}' is missing`,
        severity: 'error'
      });
    } else if (field.type === 'array' && !Array.isArray(value)) {
      errors.push({
        field: field.path,
        message: `Field '${field.path}' must be an array`,
        severity: 'error'
      });
    } else if (field.type === 'string' && typeof value !== 'string') {
      errors.push({
        field: field.path,
        message: `Field '${field.path}' must be a string`,
        severity: 'error'
      });
    }
  }
}

function validateFormats(config: CommandsConfig, errors: ValidationError[]) {
  // Validate name format
  if (config.name && !/^[a-z0-9-_]+$/.test(config.name)) {
    errors.push({
      field: 'name',
      message: 'Name must contain only lowercase letters, numbers, hyphens, and underscores',
      severity: 'error'
    });
  }

  // Validate email format
  if (config.author?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.author.email)) {
    errors.push({
      field: 'author.email',
      message: 'Invalid email format',
      severity: 'error'
    });
  }

  // Validate authentication type
  if (config.mcp?.authentication && config.mcp.authentication !== 'commands_gateway') {
    errors.push({
      field: 'mcp.authentication',
      message: 'Authentication should be "commands_gateway" for Commands.com integration',
      severity: 'warning'
    });
  }

  // Validate version format
  if (config.version && !/^\d+\.\d+\.\d+/.test(config.version)) {
    errors.push({
      field: 'version',
      message: 'Version should follow semantic versioning (e.g., 1.0.0)',
      severity: 'warning'
    });
  }
}

function validateTools(config: CommandsConfig, errors: ValidationError[]) {
  if (!Array.isArray(config.tools)) return;

  if (config.tools.length === 0) {
    errors.push({
      field: 'tools',
      message: 'At least one tool must be defined',
      severity: 'error'
    });
    return;
  }

  config.tools.forEach((tool, index) => {
    if (!tool.name) {
      errors.push({
        field: `tools[${index}].name`,
        message: 'Tool name is required',
        severity: 'error'
      });
    }

    if (!tool.description) {
      errors.push({
        field: `tools[${index}].description`,
        message: 'Tool description is required',
        severity: 'error'
      });
    }

    if (tool.description && tool.description.length < 10) {
      errors.push({
        field: `tools[${index}].description`,
        message: 'Tool description should be at least 10 characters',
        severity: 'warning'
      });
    }

    if (!tool.category) {
      errors.push({
        field: `tools[${index}].category`,
        message: 'Tool category is recommended for marketplace discovery',
        severity: 'warning'
      });
    }
  });

  // Check for duplicate tool names
  const toolNames = config.tools.map(tool => tool.name).filter(Boolean);
  const duplicates = toolNames.filter((name, index) => toolNames.indexOf(name) !== index);
  
  if (duplicates.length > 0) {
    errors.push({
      field: 'tools',
      message: `Duplicate tool names found: ${duplicates.join(', ')}`,
      severity: 'error'
    });
  }
}

function validateDeployment(config: CommandsConfig, errors: ValidationError[]) {
  if (config.mcp?.server_url?.includes('localhost') || config.mcp?.server_url?.includes('127.0.0.1')) {
    errors.push({
      field: 'mcp.server_url',
      message: 'Server URL points to localhost - update with your deployed URL',
      severity: 'error'
    });
  }

  if (config.rate_limits) {
    if (config.rate_limits.requests_per_minute && config.rate_limits.requests_per_minute > 1000) {
      errors.push({
        field: 'rate_limits.requests_per_minute',
        message: 'Very high rate limit - consider if your server can handle this load',
        severity: 'warning'
      });
    }
  }

  if (config.scopes && Array.isArray(config.scopes)) {
    const validScopes = ['read_assets', 'write_assets'];
    const invalidScopes = config.scopes.filter(scope => !validScopes.includes(scope));
    
    if (invalidScopes.length > 0) {
      errors.push({
        field: 'scopes',
        message: `Invalid scopes: ${invalidScopes.join(', ')}. Valid scopes: ${validScopes.join(', ')}`,
        severity: 'error'
      });
    }
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function printValidationResults(errors: ValidationError[]) {
  if (errors.length === 0) {
    console.log('✅ commands.yaml validation passed!');
    console.log('🚀 Your configuration is ready for Commands.com marketplace submission.\n');
    return;
  }

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  console.log(`📊 Validation Results: ${errorCount} errors, ${warningCount} warnings\n`);

  errors.forEach(error => {
    const icon = error.severity === 'error' ? '❌' : '⚠️';
    const color = error.severity === 'error' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';
    
    console.log(`${icon} ${color}${error.field}${reset}: ${error.message}`);
  });

  console.log('');

  if (errorCount > 0) {
    console.log('🚨 Fix errors before submitting to Commands.com marketplace.');
  } else {
    console.log('⚡ Address warnings to improve marketplace listing quality.');
  }
}

// Run if called directly
if (require.main === module) {
  validateCommandsYaml().catch(console.error);
}