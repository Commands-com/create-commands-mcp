#!/usr/bin/env node

// Quick test script to validate our template structure
import fs from 'fs';
import path from 'path';

function checkFileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function validateTemplate() {
  console.log('🔍 Validating create-commands-mcp template structure...\n');

  const requiredFiles = [
    'package.json',
    'tsconfig.json', 
    'README.md',
    'src/index.ts',
    'templates/common/package.json',
    'templates/common/src/index.ts',
    'templates/common/src/types.ts',
    'templates/common/src/auth/verifyToken.ts',
    'templates/basic/src/tools/index.ts',
    'templates/basic/src/tools/ping.ts',
    'templates/basic/src/tools/echo.ts', 
    'templates/basic/src/tools/datetime.ts',
    'templates/common/tests/ping.test.ts',
    'templates/common/src/scripts/doctor.ts',
    'templates/deployments/railway/railway.json',
    'templates/deployments/vercel/vercel.json',
    'templates/deployments/docker/Dockerfile'
  ];

  let passed = 0;
  let failed = 0;

  requiredFiles.forEach(file => {
    const exists = checkFileExists(file);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    
    if (exists) passed++;
    else failed++;
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 Template structure is complete!');
  } else {
    console.log('🚨 Some template files are missing');
  }
  
  return failed === 0;
}

// Also check that template files have placeholder replacements
function validatePlaceholders() {
  console.log('\n🔍 Checking template placeholders...\n');
  
  const filesToCheck = [
    'templates/common/package.json',
    'templates/common/README.md',
    'templates/common/commands.yaml'
  ];
  
  let hasPlaceholders = true;
  
  filesToCheck.forEach(file => {
    if (checkFileExists(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const placeholders = content.match(/\{\{[^}]+\}\}/g) || [];
      
      if (placeholders.length > 0) {
        console.log(`✅ ${file}: ${placeholders.length} placeholders found`);
        console.log(`   ${placeholders.join(', ')}`);
      } else {
        console.log(`❌ ${file}: No placeholders found`);
        hasPlaceholders = false;
      }
    }
  });
  
  return hasPlaceholders;
}

const structureValid = validateTemplate();
const placeholdersValid = validatePlaceholders();

if (structureValid && placeholdersValid) {
  console.log('\n🚀 Template is ready for use!');
  process.exit(0);
} else {
  console.log('\n🔧 Template needs fixes before use');
  process.exit(1);
}