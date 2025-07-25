#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate timestamp for cache busting
const timestamp = Date.now();

// Read the index.html file
const indexPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Replace version parameters with current timestamp
htmlContent = htmlContent.replace(/script\.js\?v=[^"]+/, `script.js?v=${timestamp}`);
htmlContent = htmlContent.replace(/style\.css\?v=[^"]+/, `style.css?v=${timestamp}`);

// Write back to index.html
fs.writeFileSync(indexPath, htmlContent);

console.log(`✅ Cache busting updated with timestamp: ${timestamp}`);
console.log('📁 Files updated:');
console.log(`   - script.js?v=${timestamp}`);
console.log(`   - style.css?v=${timestamp}`);

// Create a deployment info file
const deployInfo = {
  timestamp: timestamp,
  date: new Date().toISOString(),
  files: ['script.js', 'style.css']
};

fs.writeFileSync(path.join(__dirname, 'deploy-info.json'), JSON.stringify(deployInfo, null, 2));
console.log('📝 Deployment info saved to deploy-info.json');