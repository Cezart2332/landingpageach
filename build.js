#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import minification libraries
let CleanCSS, minify;
try {
  CleanCSS = require('clean-css');
  minify = require('terser').minify;
} catch (error) {
  console.log('⚠️  Minification dependencies not found. Run "npm install" to enable minification.');
  console.log('   Continuing with cache busting only...\n');
}

// Parse CLI args for dev/serve mode and port
const ARGS = process.argv.slice(2);
const DEV_MODE = ARGS.includes('--dev') || ARGS.includes('--serve');
const DEV_PORT = (() => {
  const pFlagIndex = ARGS.findIndex(a => a === '--port');
  const pValue = pFlagIndex >= 0 ? Number(ARGS[pFlagIndex + 1]) : undefined;
  return Number.isFinite(pValue) ? pValue : 3000;
})();
const PROXY_TARGET = process.env.PROXY_TARGET || 'https://api.acoomh.ro';

// Generate timestamp for cache busting
const timestamp = Date.now();

console.log('🚀 Starting build process...\n');

// Function to check if files exist
function checkRequiredFiles() {
  const requiredFiles = [
    'index.html',
    'rezervari.html',
    'restaurant.html',
    'events.html',
    'bug-reports.html',
    'merchant-requests.html',
    'rezervari-style.css',
    'rezervari-script.js',
    'restaurant-style.css',
    'restaurant-script.js',
    'events-style.css',
    'events-script.js',
    'bug-reports-style.css',
    'bug-reports-script.js',
    'merchant-requests-style.css',
    'merchant-requests-script.js',
    'gdpr-cookies.css',
    'gdpr-cookies.js',
    'acoomh.png',
    'acoomharta.mp4',
    'acoomharta_noaudio.mp4',
    'acoomharta_safe.mp4'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('❌ Missing required files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\n⚠️  These files must be uploaded to your production server!\n');
  } else {
    console.log('✅ All required files present\n');
  }
  
  return missingFiles;
}

// Function to minify CSS
function minifyCSS(cssContent) {
  if (!CleanCSS) return cssContent;
  
  const cleanCSS = new CleanCSS({
    level: 2,
    returnPromise: false
  });
  
  const result = cleanCSS.minify(cssContent);
  
  if (result.errors.length > 0) {
    console.log('⚠️  CSS minification warnings:', result.errors);
    return cssContent;
  }
  
  return result.styles;
}

// Function to minify JavaScript
async function minifyJS(jsContent) {
  if (!minify) return jsContent;
  
  try {
    const result = await minify(jsContent, {
      compress: {
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: {
        keep_fnames: true // Keep function names for debugging
      },
      format: {
        comments: false
      }
    });
    
    return result.code || jsContent;
  } catch (error) {
    console.log('⚠️  JavaScript minification error:', error.message);
    return jsContent;
  }
}

// Function to process CSS files
function processCSS() {
  const cssFiles = [
    { name: 'style.css', output: 'style.min.css', label: 'CSS' },
    { name: 'rezervari-style.css', output: 'rezervari-style.min.css', label: 'Rezervari CSS' },
    { name: 'restaurant-style.css', output: 'restaurant-style.min.css', label: 'Restaurant CSS' },
    { name: 'events-style.css', output: 'events-style.min.css', label: 'Events CSS' },
    { name: 'event-style.css', output: 'event-style.min.css', label: 'Event CSS' },
    { name: 'bug-reports-style.css', output: 'bug-reports-style.min.css', label: 'Bug Reports CSS' },
    { name: 'merchant-requests-style.css', output: 'merchant-requests-style.min.css', label: 'Merchant Requests CSS' },
    { name: 'gdpr-cookies.css', output: 'gdpr-cookies.min.css', label: 'GDPR Cookies CSS' }
  ];

  cssFiles.forEach(cssFile => {
    const cssPath = path.join(__dirname, cssFile.name);
    if (fs.existsSync(cssPath)) {
      try {
        const originalCSS = fs.readFileSync(cssPath, 'utf8');
        const minifiedCSS = minifyCSS(originalCSS);
        
        if (CleanCSS) {
          // Create minified version
          const minifiedPath = path.join(__dirname, cssFile.output);
          fs.writeFileSync(minifiedPath, minifiedCSS);
          
          const originalSize = (originalCSS.length / 1024).toFixed(2);
          const minifiedSize = (minifiedCSS.length / 1024).toFixed(2);
          const savings = (((originalCSS.length - minifiedCSS.length) / originalCSS.length) * 100).toFixed(1);
          
          console.log(`✅ ${cssFile.label} minified: ${originalSize}KB → ${minifiedSize}KB (${savings}% smaller)`);
        }
      } catch (error) {
        console.log(`⚠️  Error processing ${cssFile.label}:`, error.message);
      }
    }
  });
}

// Function to process JavaScript files
async function processJS() {
  const jsFiles = [
    { name: 'script.js', output: 'script.min.js', label: 'JavaScript' },
    { name: 'rezervari-script.js', output: 'rezervari-script.min.js', label: 'Rezervari JavaScript' },
    { name: 'restaurant-script.js', output: 'restaurant-script.min.js', label: 'Restaurant JavaScript' },
    { name: 'events-script.js', output: 'events-script.min.js', label: 'Events JavaScript' },
    { name: 'event-script.js', output: 'event-script.min.js', label: 'Event JavaScript' },
    { name: 'bug-reports-script.js', output: 'bug-reports-script.min.js', label: 'Bug Reports JavaScript' },
    { name: 'merchant-requests-script.js', output: 'merchant-requests-script.min.js', label: 'Merchant Requests JavaScript' },
    { name: 'gdpr-cookies.js', output: 'gdpr-cookies.min.js', label: 'GDPR Cookies JavaScript' }
  ];

  for (const jsFile of jsFiles) {
    const jsPath = path.join(__dirname, jsFile.name);
    if (fs.existsSync(jsPath)) {
      try {
        const originalJS = fs.readFileSync(jsPath, 'utf8');
        const minifiedJS = await minifyJS(originalJS);
        
        if (minify && minifiedJS !== originalJS) {
          // Create minified version
          const minifiedPath = path.join(__dirname, jsFile.output);
          fs.writeFileSync(minifiedPath, minifiedJS);
          
          const originalSize = (originalJS.length / 1024).toFixed(2);
          const minifiedSize = (minifiedJS.length / 1024).toFixed(2);
          const savings = (((originalJS.length - minifiedJS.length) / originalJS.length) * 100).toFixed(1);
          
          console.log(`✅ ${jsFile.label} minified: ${originalSize}KB → ${minifiedSize}KB (${savings}% smaller)`);
        }
      } catch (error) {
        console.log(`⚠️  Error processing ${jsFile.label}:`, error.message);
      }
    }
  }
}

function updateHTML() {
  const useMinified = CleanCSS && minify;
  
  // HTML files to update
  const htmlFiles = [
    {
      path: 'index.html',
      css: useMinified ? 'style.min.css' : 'style.css',
      js: useMinified ? 'script.min.js' : 'script.js'
    },
    {
      path: 'rezervari.html',
      css: useMinified ? 'rezervari-style.min.css' : 'rezervari-style.css',
      js: useMinified ? 'rezervari-script.min.js' : 'rezervari-script.js'
    },
    {
      path: 'restaurant.html',
      css: useMinified ? 'restaurant-style.min.css' : 'restaurant-style.css',
      js: useMinified ? 'restaurant-script.min.js' : 'restaurant-script.js'
    },
    {
      path: 'events.html',
      css: useMinified ? 'events-style.min.css' : 'events-style.css',
      js: useMinified ? 'events-script.min.js' : 'events-script.js'
    },
    {
      path: 'bug-reports.html',
      css: useMinified ? 'bug-reports-style.min.css' : 'bug-reports-style.css',
      js: useMinified ? 'bug-reports-script.min.js' : 'bug-reports-script.js'
    },
    {
      path: 'merchant-requests.html',
      css: useMinified ? 'merchant-requests-style.min.css' : 'merchant-requests-style.css',
      js: useMinified ? 'merchant-requests-script.min.js' : 'merchant-requests-script.js'
    }
  ];
  
  htmlFiles.forEach(htmlFile => {
    const htmlPath = path.join(__dirname, htmlFile.path);
    if (fs.existsSync(htmlPath)) {
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Extract base names for replacement patterns
      const cssBase = htmlFile.css.replace(/\.min/, '').replace(/\.css/, '');
      const jsBase = htmlFile.js.replace(/\.min/, '').replace(/\.js/, '');
      
      // Replace CSS and JS references with cache busting
      htmlContent = htmlContent.replace(
        new RegExp(`${cssBase}(\\.min)?\\.css(\\?v=[^"]+)?`, 'g'),
        `${htmlFile.css}?v=${timestamp}`
      );
      htmlContent = htmlContent.replace(
        new RegExp(`${jsBase}(\\.min)?\\.js(\\?v=[^"]+)?`, 'g'),
        `${htmlFile.js}?v=${timestamp}`
      );
      
      fs.writeFileSync(htmlPath, htmlContent);
    }
  });
  
  console.log(`\n✅ Cache busting updated with timestamp: ${timestamp}`);
  console.log('📁 Files updated:');
  htmlFiles.forEach(htmlFile => {
    if (fs.existsSync(path.join(__dirname, htmlFile.path))) {
      console.log(`   - ${htmlFile.css}?v=${timestamp}`);
      console.log(`   - ${htmlFile.js}?v=${timestamp}`);
    }
  });
  
  // Create a deployment info file
  const deployInfo = {
    timestamp: timestamp,
    date: new Date().toISOString(),
    minified: useMinified,
    files: {
      css: useMinified ? 'style.min.css' : 'style.css',
      js: useMinified ? 'script.min.js' : 'script.js',
      rezervariCss: useMinified ? 'rezervari-style.min.css' : 'rezervari-style.css',
      rezervariJs: useMinified ? 'rezervari-script.min.js' : 'rezervari-script.js',
      restaurantCss: useMinified ? 'restaurant-style.min.css' : 'restaurant-style.css',
      restaurantJs: useMinified ? 'restaurant-script.min.js' : 'restaurant-script.js',
      eventsCss: useMinified ? 'events-style.min.css' : 'events-style.css',
      eventsJs: useMinified ? 'events-script.min.js' : 'events-script.js',
      bugReportsCss: useMinified ? 'bug-reports-style.min.css' : 'bug-reports-style.css',
      bugReportsJs: useMinified ? 'bug-reports-script.min.js' : 'bug-reports-script.js',
      merchantRequestsCss: useMinified ? 'merchant-requests-style.min.css' : 'merchant-requests-style.css',
      merchantRequestsJs: useMinified ? 'merchant-requests-script.min.js' : 'merchant-requests-script.js',
      gdprCookiesCss: useMinified ? 'gdpr-cookies.min.css' : 'gdpr-cookies.css',
      gdprCookiesJs: useMinified ? 'gdpr-cookies.min.js' : 'gdpr-cookies.js'
    }
  };
  
  fs.writeFileSync(path.join(__dirname, 'deploy-info.json'), JSON.stringify(deployInfo, null, 2));
  console.log('📝 Deployment info saved to deploy-info.json');
  
  if (useMinified) {
    console.log('\n🎉 Build complete! Minified files are ready for production.');
    console.log('📦 Files to deploy to /var/www/acoomh/:');
    console.log('   - index.html');
    console.log('   - rezervari.html');
    console.log('   - restaurant.html');
    console.log('   - events.html');
    console.log('   - bug-reports.html');
    console.log('   - merchant-requests.html');
    console.log('   - style.min.css');
    console.log('   - script.min.js');
    console.log('   - rezervari-style.min.css');
    console.log('   - rezervari-script.min.js');
    console.log('   - restaurant-style.min.css');
    console.log('   - restaurant-script.min.js');
    console.log('   - events-style.min.css');
    console.log('   - events-script.min.js');
    console.log('   - bug-reports-style.min.css');
    console.log('   - bug-reports-script.min.js');
    console.log('   - merchant-requests-style.min.css');
    console.log('   - merchant-requests-script.min.js');
    console.log('   - gdpr-cookies.min.css   🍪 GDPR Cookie System');
    console.log('   - gdpr-cookies.min.js    🍪 GDPR Cookie System');
    console.log('   - acoomh.png');
    console.log('   - acoomharta.mp4');
    console.log('   - acoomharta_noaudio.mp4  ⭐ CRITICAL FOR SAFARI!');
    console.log('   - acoomharta_safe.mp4');
    console.log('   - nginx.conf (update server config)');
    console.log('\n🔧 After uploading files:');
    console.log('   1. sudo nginx -t (test config)');
    console.log('   2. sudo systemctl reload nginx');
    console.log('   3. Check https://acoomh.ro/acoomharta_noaudio.mp4 directly');
    console.log('   4. Test rezervari page: https://acoomh.ro/rezervari.html');
    console.log('   5. Test admin pages: https://acoomh.ro/bug-reports.html');
    console.log('   6. Test admin pages: https://acoomh.ro/merchant-requests.html');
  } else {
    console.log('\n💡 Tip: Run "npm install" to enable CSS/JS minification for smaller file sizes.');
    console.log('📦 Files to deploy (without minification):');
    console.log('   - index.html');
    console.log('   - rezervari.html');
    console.log('   - restaurant.html');
    console.log('   - events.html');
    console.log('   - bug-reports.html');
    console.log('   - merchant-requests.html');
    console.log('   - style.css');
    console.log('   - script.js');
    console.log('   - rezervari-style.css');
    console.log('   - rezervari-script.js');
    console.log('   - restaurant-style.css');
    console.log('   - restaurant-script.js');
    console.log('   - events-style.css');
    console.log('   - events-script.js');
    console.log('   - bug-reports-style.css');
    console.log('   - bug-reports-script.js');
    console.log('   - merchant-requests-style.css');
    console.log('   - merchant-requests-script.js');
    console.log('   - gdpr-cookies.css       🍪 GDPR Cookie System');
    console.log('   - gdpr-cookies.js        🍪 GDPR Cookie System');
    console.log('   - acoomh.png');
    console.log('   - All video files');
  }
}

// Main function to run the build process
async function main() {
  try {
    // Check files first
    checkRequiredFiles();
    
    // Process CSS files (synchronous)
    processCSS();
    
    // Process JavaScript files (asynchronous)
    await processJS();
    
    // Update HTML files
    updateHTML();
    
    console.log('\n✨ Build process completed successfully!');
    // In dev mode, keep process alive for the dev server
    if (!DEV_MODE) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Build process failed:', error.message);
    // In dev mode, keep process alive so server can still start for debugging
    if (!DEV_MODE) {
      process.exit(1);
    }
  }
}

// --- Dev server with proxy (Express) ---
function startDevServer({ port = DEV_PORT, proxyTarget = PROXY_TARGET } = {}) {
  let express, createProxyMiddleware;
  try {
    express = require('express');
    ({ createProxyMiddleware } = require('http-proxy-middleware'));
  } catch (err) {
    console.log('\n❌ Dev server dependencies missing. Install them with:');
    console.log('   npm i --save-dev express http-proxy-middleware');
    return;
  }

  const app = express();

  // Static files from project root
  app.use(express.static(__dirname));

  // Common proxy options
  const commonProxyOpts = {
    target: proxyTarget,
    changeOrigin: true,
    secure: false, // dev only
    logLevel: 'warn',
    onProxyReq: (proxyReq) => {
      try {
        if (typeof proxyReq.removeHeader === 'function') {
          proxyReq.removeHeader('origin');
        } else {
          proxyReq.setHeader('origin', '');
        }
      } catch (e) {
        // no-op
      }
    },
  };

  // /api/* -> remove /api -> upstream sees original path (e.g., /api/locations -> /locations)
  app.use('/api', createProxyMiddleware({
    ...commonProxyOpts,
    pathRewrite: { '^/api': '' },
  }));

  // /proxy/* -> remove /proxy
  app.use('/proxy', createProxyMiddleware({
    ...commonProxyOpts,
    pathRewrite: { '^/proxy': '' },
  }));

  // Direct /locations passthrough (no rewrite) - matches /locations and /locations/*
  app.use('/locations', createProxyMiddleware({
    ...commonProxyOpts,
  }));

  app.listen(port, () => {
    console.log('\n▶️  Dev server running at http://localhost:' + port);
    console.log('   Serving static files from: ' + __dirname);
    console.log('   Proxy target: ' + proxyTarget);
    console.log('   Proxy rules:');
    console.log('     - /api/*    -> ' + proxyTarget + ' (rewrite: ^/api → /)');
    console.log('     - /proxy/*  -> ' + proxyTarget + ' (rewrite: ^/proxy → /)');
    console.log('     - /locations -> ' + proxyTarget + '/locations (no rewrite)');
    console.log('\nTips: In dev use /api/locations or /proxy/locations. The proxy rewrites /api/locations → /locations upstream.');
  });
}

// Run build, then optionally start the dev server
(async function run() {
  await main();
  if (DEV_MODE) {
    startDevServer({ port: DEV_PORT, proxyTarget: PROXY_TARGET });
  }
})();