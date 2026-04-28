#!/usr/bin/env node
/**
 * Generate version.js from package.json
 * Run this script before build to sync versions
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

const version = packageJson.version || '0.0.0';
const buildDate = new Date().toISOString();
const cacheVersion = `v${version.replace(/\./g, '-')}`;

// Generate version.js content
const content = `// version.js - Centralized version configuration for PinoyPOS
// This file is auto-generated from package.json during build
// DO NOT EDIT MANUALLY - Update package.json version instead
// Generated: ${buildDate}

export const APP_VERSION = '${version}'; // Semantic versioning: MAJOR.MINOR.PATCH
export const BUILD_DATE = '${buildDate}';
export const CACHE_VERSION = '${cacheVersion}'; // e.g., v1-0-0

// Service Worker cache names (auto-generated from APP_VERSION)
export const SW_CACHE_NAME = \`pinoypos-\${CACHE_VERSION}\`;
export const SW_API_CACHE_NAME = \`pinoypos-api-\${CACHE_VERSION}\`;

// Image cache version
export const IMAGE_CACHE_VERSION = CACHE_VERSION;

// API compatibility version (update when breaking API changes occur)
export const API_VERSION = 'v1';

// Feature flags (optional)
export const FEATURES = {
  offlineMode: true,
  pwaInstall: true,
  bulkImport: true,
  analytics: true,
};

// Environment info
export const ENV_INFO = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Full version string for display
export const VERSION_STRING = \`\${APP_VERSION} (\${BUILD_DATE.split('T')[0]})\`;

// Version info object (for API responses)
export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: BUILD_DATE,
  cacheVersion: CACHE_VERSION,
  apiVersion: API_VERSION,
  environment: import.meta.env.MODE,
};

export default {
  APP_VERSION,
  BUILD_DATE,
  CACHE_VERSION,
  SW_CACHE_NAME,
  SW_API_CACHE_NAME,
  IMAGE_CACHE_VERSION,
  API_VERSION,
  FEATURES,
  ENV_INFO,
  VERSION_STRING,
  VERSION_INFO,
};
`;

// Write version.js
const versionPath = path.join(__dirname, '../src/version.js');
fs.writeFileSync(versionPath, content);

console.log(`✅ Generated version.js`);
console.log(`   Version: ${version}`);
console.log(`   Build Date: ${buildDate}`);
console.log(`   Cache Version: ${cacheVersion}`);
