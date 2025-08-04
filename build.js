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

// Generate timestamp for cache busting
const timestamp = Date.now();

console.log('🚀 Starting build process...\n');

// Function to check if files exist
function checkRequiredFiles() {
  const requiredFiles = [
    'index.html',
    'rezervari.html',
    'restaurant.html',
    'bug-reports.html',
    'merchant-requests.html',
    'rezervari-style.css',
    'rezervari-script.js',
    'restaurant-style.css',
    'restaurant-script.js',
    'bug-reports-style.css',
    'bug-reports-script.js',
    'merchant-requests-style.css',
    'merchant-requests-script.js',
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

// Check files first
checkRequiredFiles();

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

// CSS files to process
const cssFiles = [
  { name: 'style.css', output: 'style.min.css', label: 'CSS' },
  { name: 'rezervari-style.css', output: 'rezervari-style.min.css', label: 'Rezervari CSS' },
  { name: 'restaurant-style.css', output: 'restaurant-style.min.css', label: 'Restaurant CSS' },
  { name: 'bug-reports-style.css', output: 'bug-reports-style.min.css', label: 'Bug Reports CSS' },
  { name: 'merchant-requests-style.css', output: 'merchant-requests-style.min.css', label: 'Merchant Requests CSS' }
];

// Process all CSS files
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

// JavaScript files to process
const jsFiles = [
  { name: 'script.js', output: 'script.min.js', label: 'JavaScript' },
  { name: 'rezervari-script.js', output: 'rezervari-script.min.js', label: 'Rezervari JavaScript' },
  { name: 'restaurant-script.js', output: 'restaurant-script.min.js', label: 'Restaurant JavaScript' },
  { name: 'bug-reports-script.js', output: 'bug-reports-script.min.js', label: 'Bug Reports JavaScript' },
  { name: 'merchant-requests-script.js', output: 'merchant-requests-script.min.js', label: 'Merchant Requests JavaScript' }
];

// Process all JavaScript files
(async () => {
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
  
  // Update HTML files after processing all JS files
  updateHTML();
})();

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
      console.log(`   - ${htmlFile.css}?v=${timestamp}`);
      console.log(`   - ${htmlFile.js}?v=${timestamp}`);
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
      bugReportsCss: useMinified ? 'bug-reports-style.min.css' : 'bug-reports-style.css',
      bugReportsJs: useMinified ? 'bug-reports-script.min.js' : 'bug-reports-script.js',
      merchantRequestsCss: useMinified ? 'merchant-requests-style.min.css' : 'merchant-requests-style.css',
      merchantRequestsJs: useMinified ? 'merchant-requests-script.min.js' : 'merchant-requests-script.js'
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
    console.log('   - bug-reports.html');
    console.log('   - merchant-requests.html');
    console.log('   - style.min.css');
    console.log('   - script.min.js');
    console.log('   - rezervari-style.min.css');
    console.log('   - rezervari-script.min.js');
    console.log('   - restaurant-style.min.css');
    console.log('   - restaurant-script.min.js');
    console.log('   - bug-reports-style.min.css');
    console.log('   - bug-reports-script.min.js');
    console.log('   - merchant-requests-style.min.css');
    console.log('   - merchant-requests-script.min.js');
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
    console.log('   - bug-reports.html');
    console.log('   - merchant-requests.html');
    console.log('   - style.css');
    console.log('   - script.js');
    console.log('   - rezervari-style.css');
    console.log('   - rezervari-script.js');
    console.log('   - restaurant-style.css');
    console.log('   - restaurant-script.js');
    console.log('   - bug-reports-style.css');
    console.log('   - bug-reports-script.js');
    console.log('   - merchant-requests-style.css');
    console.log('   - merchant-requests-script.js');
    console.log('   - acoomh.png');
    console.log('   - All video files');
  }
}