#!/usr/bin/env node

/**
 * Generate PWA icons using Canvas
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Simple SVG to PNG conversion using inline SVG
const sizes = [192, 512];

sizes.forEach(size => {
  // Create SVG with green background and white "P"
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#00C853"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.6}" 
        font-weight="bold" 
        fill="#FFFFFF" 
        text-anchor="middle" 
        dominant-baseline="central">P</text>
    </svg>
  `;
  
  const outputPath = path.join(__dirname, '..', 'public', `icon-${size}x${size}.svg`);
  fs.writeFileSync(outputPath, svg.trim());
  console.log(`✅ Created: icon-${size}x${size}.svg`);
});

console.log('\n📋 SVG icons created! Converting to PNG...');
console.log('👉 Visit https://svgtopng.com or https://cloudconvert.com/svg-to-png');
console.log('👉 Upload the SVG files and download as PNG');
console.log('👉 Or use ImageMagick: convert icon-192x192.svg icon-192x192.png');
