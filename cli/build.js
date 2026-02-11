#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceDir: './dist',
  destDir: '../desktop/gen',
  declarationPattern: /\.d\.ts$/, // Matches .d.ts files
  declarationMapPattern: /\.d\.ts\.map$/, // Matches .d.ts.map files
};

function main() {
  console.log('🚀 Starting TypeScript build and copy process...\n');

  // Step 1: Run TypeScript compiler
  console.log('📦 Running npx tsc...');
  try {
    execSync('npx tsc', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation completed\n');
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
  }

  // Step 2: Ensure destination directory exists
  console.log('📁 Setting up destination directory...');
  if (!fs.existsSync(CONFIG.destDir)) {
    fs.mkdirSync(CONFIG.destDir, { recursive: true });
    console.log(`   Created: ${CONFIG.destDir}`);
  }

  // Step 3: Copy declaration files
  console.log('\n📋 Copying declaration files...');
  const copiedFiles = copyDeclarationFiles(CONFIG.sourceDir, CONFIG.destDir);

  if (copiedFiles.length === 0) {
    console.warn('⚠️  No .d.ts files found to copy');
  } else {
    console.log(`\n✅ Successfully copied ${copiedFiles.length} file(s):`);
    copiedFiles.forEach(file => console.log(`   → ${file}`));
  }

  console.log('\n🎉 Done!');
}

function copyDeclarationFiles(sourceDir, destDir) {
  const copiedFiles = [];

  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(sourceDir, fullPath);
      const destPath = path.join(destDir, relativePath);

      if (entry.isDirectory()) {
        // Create corresponding directory in destination
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        walkDir(fullPath);
      } else if (
        CONFIG.declarationPattern.test(entry.name) ||
        CONFIG.declarationMapPattern.test(entry.name)
      ) {
        // Copy declaration files
        fs.copyFileSync(fullPath, destPath);
        copiedFiles.push(relativePath);
      }
    }
  }

  if (fs.existsSync(sourceDir)) {
    walkDir(sourceDir);
  }

  return copiedFiles;
}

// Run the script
main();